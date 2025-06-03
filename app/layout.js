import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Medimeet - Doctors Appointment App",
  description: "Connect with doctors and book appointments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <main>{children}</main>
        <footer className="bg-muted/50 py-12">
          <div className="container mx-auto px-4 text-center text-gray-200">
            <p>
              &copy; {new Date().getFullYear()} Medimeet. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
