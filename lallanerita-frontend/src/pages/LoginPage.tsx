import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [regData, setRegData] = useState({ email: "", password: "", name: "", phone: "", address: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      navigate("/catalogo");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(regData);
      navigate("/catalogo");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <img src="/logo.png" alt="La Llanerita" className="h-16 w-16 rounded-full mx-auto mb-2 object-cover" />
          <CardTitle className="text-2xl text-white">La Llanerita</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{error}</div>}
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="login" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">Ingresar</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <Input type="email" required className="bg-gray-800 border-gray-700 text-white" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
                </div>
                <div>
                  <Label className="text-gray-300">Contrasena</Label>
                  <Input type="password" required className="bg-gray-800 border-gray-700 text-white" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
                </div>
                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-300">Nombre</Label>
                  <Input required className="bg-gray-800 border-gray-700 text-white" value={regData.name} onChange={(e) => setRegData({ ...regData, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <Input type="email" required className="bg-gray-800 border-gray-700 text-white" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} />
                </div>
                <div>
                  <Label className="text-gray-300">Contrasena</Label>
                  <Input type="password" required className="bg-gray-800 border-gray-700 text-white" value={regData.password} onChange={(e) => setRegData({ ...regData, password: e.target.value })} />
                </div>
                <div>
                  <Label className="text-gray-300">Telefono</Label>
                  <Input className="bg-gray-800 border-gray-700 text-white" value={regData.phone} onChange={(e) => setRegData({ ...regData, phone: e.target.value })} />
                </div>
                <div>
                  <Label className="text-gray-300">Direccion</Label>
                  <Input className="bg-gray-800 border-gray-700 text-white" value={regData.address} onChange={(e) => setRegData({ ...regData, address: e.target.value })} />
                </div>
                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold" disabled={loading}>
                  {loading ? "Registrando..." : "Registrarse"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
