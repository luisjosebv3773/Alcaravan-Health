import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Manejo de CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Crear cliente de Supabase con permisos de Admin (Service Role)
        // Esto es seguro porque corre en el servidor.
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 2. Obtener datos del cuerpo de la petición
        const { action, appointment_id, reason, meet_link, doctor_name } = await req.json();

        if (!appointment_id || !action) {
            throw new Error("Faltan parámetros requeridos: appointment_id y action");
        }

        // 3. Obtener la cita actual para saber a quién notificar
        const { data: appointment, error: fetchError } = await supabase
            .from("appointments")
            .select("patient_id, appointment_date, appointment_time")
            .eq("id", appointment_id)
            .single();

        if (fetchError || !appointment) {
            throw new Error("Cita no encontrada");
        }

        const patientId = appointment.patient_id;
        let notificationTitle = "";
        let notificationBody = "";
        let status = "";
        let updateData: any = {};

        // 4. Definir lógica según la acción
        switch (action) {
            case "approve":
                status = "confirmed";
                updateData = { status: "confirmed" };
                if (meet_link) updateData.meet_link = meet_link;

                notificationTitle = "Cita Confirmada";
                notificationBody = `Tu cita para el ${appointment.appointment_date} a las ${appointment.appointment_time} ha sido confirmada por el Dr. ${doctor_name || 'Alcaraván'}.`;
                break;

            case "reject":
                status = "cancelled";
                updateData = { status: "cancelled" }; // No borramos, solo cancelamos
                notificationTitle = "Solicitud de Cita Rechazada";
                notificationBody = `Lo sentimos, su solicitud de cita para el ${appointment.appointment_date} ha sido rechazada por el profesional.`;
                break;

            case "noshow":
                status = "no-show";
                updateData = { status: "no-show" };
                notificationTitle = "Inasistencia Registrada";
                notificationBody = `Se ha registrado que no asististe a tu cita del ${appointment.appointment_date}. Si crees que es un error, contacta a soporte.`;
                break;

            default:
                throw new Error("Acción no válida");
        }

        // 5. Ejecutar actualización de Cita
        const { error: updateError } = await supabase
            .from("appointments")
            .update(updateData)
            .eq("id", appointment_id);

        if (updateError) throw updateError;

        // 6. Insertar Notificación (Si falla, al menos la cita ya se actualizó, 
        // en un entorno SQL puro haríamos rollback, pero aquí priorizamos la operación principal)
        const { error: notifError } = await supabase
            .from("notificaciones")
            .insert({
                user_id: patientId,
                titulo: notificationTitle,
                mensaje: notificationBody,
                tipo: "cita",
                leido: false // Asumimos default false
            });

        if (notifError) console.error("Error enviando notificación interna:", notifError);

        // 7. (Opcional) Aquí podríamos llamar a send-fcm para Push Notification real
        // await fetch(MY_FCM_FUNCTION_URL, ...)

        return new Response(JSON.stringify({ success: true, status, message: "Proceso completado correctamente" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
