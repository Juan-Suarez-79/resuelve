import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 pb-24">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <Link href="/" className="inline-flex items-center text-gray-500 mb-6 hover:text-brand-red transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Volver al Inicio
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones de Uso</h1>

                <div className="prose prose-red max-w-none text-gray-600 space-y-4">
                    <p><strong>Última actualización: {new Date().toLocaleDateString()}</strong></p>

                    <h3>1. Objeto de la Plataforma</h3>
                    <p>La presente plataforma tiene como finalidad facilitar la conexión entre comerciantes que utilizan WhatsApp y potenciales clientes, ofreciendo herramientas digitales para mejorar la visibilidad y gestión de sus negocios.</p>

                    <h3>2. Aceptación de los Términos</h3>
                    <p>Al acceder y utilizar la plataforma, el usuario acepta de manera expresa estos Términos y Condiciones. Si no está de acuerdo, debe abstenerse de usar el servicio.</p>

                    <h3>3. Responsabilidad del Usuario</h3>
                    <p>Cada usuario es único responsable de las actividades que realice dentro de la plataforma.</p>
                    <p>La plataforma no se hace responsable de delitos, fraudes, estafas, robos, suplantaciones de identidad o cualquier otra conducta ilícita cometida por los usuarios.</p>
                    <p>El usuario se compromete a utilizar la plataforma únicamente con fines legales y comerciales legítimos.</p>

                    <h3>4. Prohibiciones</h3>
                    <p>Queda estrictamente prohibido:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Utilizar la plataforma para actividades ilícitas (robo, estafa, fraude, lavado de dinero, etc.).</li>
                        <li>Publicar información falsa, engañosa o difamatoria.</li>
                        <li>Suplantar la identidad de terceros.</li>
                        <li>Intentar manipular, hackear o alterar el funcionamiento de la plataforma.</li>
                    </ul>

                    <h3>5. Sanciones</h3>
                    <p>En caso de detectar actividades ilícitas:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>El usuario será suspendido de manera inmediata y permanente.</li>
                        <li>Se podrán bloquear sus datos y accesos sin previo aviso.</li>
                        <li>La plataforma se reserva el derecho de informar a las autoridades competentes y colaborar en cualquier investigación.</li>
                        <li>El usuario infractor será responsable de indemnizar y reparar cualquier daño causado a otros usuarios o a la plataforma.</li>
                    </ul>

                    <h3>6. Exoneración de Responsabilidad</h3>
                    <p>La plataforma:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>No garantiza la veracidad de la información publicada por los usuarios.</li>
                        <li>No se responsabiliza por pérdidas económicas, daños materiales o morales derivados de interacciones entre comerciantes y clientes.</li>
                        <li>No asume compromiso alguno frente a delitos cometidos por terceros utilizando el servicio.</li>
                    </ul>

                    <h3>7. Privacidad y Datos</h3>
                    <p>Los datos de los usuarios serán tratados conforme a la legislación vigente en materia de protección de datos. La plataforma no comparte información personal con terceros salvo obligación legal.</p>

                    <h3>8. Modificaciones</h3>
                    <p>La plataforma podrá modificar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor desde su publicación.</p>

                    <h3>9. Legislación Aplicable</h3>
                    <p>Estos Términos y Condiciones se rigen por las leyes de la República Bolivariana de Venezuela. Cualquier controversia será resuelta en los tribunales competentes.</p>
                </div>
            </div>
        </div>
    );
}
