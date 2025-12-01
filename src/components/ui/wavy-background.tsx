export function WavyBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Top Right Shapes */}
            <div className="absolute top-0 right-0 w-[80%] h-[40%]">
                <svg
                    viewBox="0 0 200 200"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                    preserveAspectRatio="none"
                >
                    {/* Yellow Blob */}
                    <path
                        fill="#FBC02D"
                        d="M120,0 C150,0 180,30 200,60 L200,0 Z"
                        transform="scale(1.5) translate(-50, -20)"
                        className="opacity-90"
                    />
                    {/* Red Wave */}
                    <path
                        fill="#D32F2F"
                        d="M100,0 C140,0 160,40 200,50 L200,0 Z"
                        transform="scale(1.2)"
                    />
                </svg>
            </div>

            {/* Better SVG approximation for Top Right based on image */}
            <div className="absolute -top-10 -right-10 w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M0 0H100V80C100 80 80 100 50 60C20 20 0 40 0 40V0Z" fill="#FBC02D" transform="translate(20, -10)" />
                    <path d="M20 0H100V60C100 60 80 80 60 50C40 20 20 0 20 0Z" fill="#D32F2F" />
                </svg>
            </div>

            {/* Bottom Left Shapes */}
            <div className="absolute -bottom-10 -left-10 w-[250px] h-[250px] md:w-[350px] md:h-[350px]">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform rotate-180">
                    <path d="M0 0H100V80C100 80 80 100 50 60C20 20 0 40 0 40V0Z" fill="#FBC02D" transform="translate(20, -10)" />
                    <path d="M20 0H100V60C100 60 80 80 60 50C40 20 20 0 20 0Z" fill="#D32F2F" />
                </svg>
            </div>
        </div>
    );
}
