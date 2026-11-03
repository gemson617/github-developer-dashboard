import Providers from "./components/Providers";

import "./globals.css";

export const metadata = {
  title: "DevBoard | GitHub Developer Dashboard",
  description: "Your personal GitHub developer dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
