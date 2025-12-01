import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 pb-24">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <Link href="/" className="inline-flex items-center text-gray-500 mb-6 hover:text-brand-red transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Volver al Inicio
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>

                <div className="prose prose-red max-w-none text-gray-600 space-y-4">
                    <p><strong>Última actualización: {new Date().toLocaleDateString()}</strong></p>

                    <h3>1. Información que Recopilamos</h3>
                    <p>Podemos recopilar información personal que nos proporcionas directamente, como:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Nombre y datos de contacto (correo electrónico, teléfono).</li>
                        <li>Información de ubicación para mostrarte tiendas cercanas.</li>
                        <li>Historial de pedidos y preferencias de compra.</li>
                    </ul>

                    <h3>2. Uso de la Información</h3>
                    <p>Utilizamos la información recopilada para:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
                        <li>Procesar transacciones y enviar notificaciones relacionadas.</li>
                        <li>Personalizar tu experiencia y ofrecerte contenido relevante.</li>
                    </ul>

                    <h3>3. Compartir Información</h3>
                    <p>No vendemos tu información personal a terceros. Podemos compartir información con:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Vendedores, únicamente lo necesario para procesar tu pedido (ej. nombre, dirección de entrega).</li>
                        <li>Proveedores de servicios que nos ayudan a operar la plataforma.</li>
                        <li>Autoridades legales, si así lo requiere la ley.</li>
                    </ul>

                    <h3>4. Seguridad de los Datos</h3>
                    <p>Implementamos medidas de seguridad razonables para proteger tu información contra el acceso no autorizado, la alteración o la destrucción.</p>

                    <h3>5. Tus Derechos</h3>
                    <p>Tienes derecho a acceder, corregir o eliminar tu información personal. Puedes gestionar gran parte de tu información directamente desde tu perfil en la aplicación.</p>

                    <h3>6. Cambios en esta Política</h3>
                    <p>Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos a través de la aplicación o por correo electrónico.</p>
                </div>
            </div>
        </div>
    );
}
