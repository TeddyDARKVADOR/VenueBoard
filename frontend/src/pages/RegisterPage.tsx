import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const profileResp = await client.post("/user_profiles", {
        user_profile_name: name.trim(),
        user_profile_role: "guest",
      });
      const user_profile_id = profileResp.data?.user_profile_id;
      if (!user_profile_id) {
        throw new Error("Impossible de créer le profil utilisateur");
      }
      await client.post("/user_auths", {
        user_auth_login: login.trim(),
        user_auth_password: password,
        user_profile_id,
      });
      navigate("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">VenueBoard</div>
        <div className="auth-subtitle">Créez votre compte</div>
        <form className="form" onSubmit={submit}>
          <label>
            Nom
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Login
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="error-msg">{error}</div>}
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
        <div className="auth-link">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
