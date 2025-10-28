
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-400 py-2 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8">
          
          {/* Logo Section - Left side */}
          <div className="flex-shrink-0">
            <div className="rounded-full flex items-center justify-center">
              <img 
                src="/src/assets/logos/Logo-Completo1.png" 
                alt="Logo" 
                className="w-35 h-35 object-contain"
              />
            </div>
          </div>

          {/* Content Sections - Right side */}
          <div className="flex-1 flex flex-col md:flex-row justify-center md:justify-around items-center gap-8 md:gap-16">
            
            {/* Contact Info Section */}
            <div className="text-center">
              <h3 className="text-white text-lg font-semibold mb-4">
                Medios de contacto
              </h3>
              <div className="space-y-2 text-white text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+54 261 4992230</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>mail@elbuensabor.com.ar</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Av. San Martín 123, Ciudad, Mendoza</span>
                </div>
              </div>
            </div>

            {/* Social Media Section */}
            <div className="text-center">
              <h3 className="text-white text-lg font-semibold mb-4 underline">
                Seguinos en nuestras redes!
              </h3>
              <div className="space-y-2 text-white text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Instagram className="w-4 h-4" />
                  <span>@ElBuenSabor-Restaurante</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Facebook className="w-4 h-4" />
                  <span>El-Buen-Sabor</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;