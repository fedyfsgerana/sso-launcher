import { LoginArt } from "@/components/auth/login-art";
import { LoginForm } from "@/components/auth/login-form";
import { APP_VERSION } from "@/lib/portal/version";

export default function LoginPage() {
  return (
    <section className="lp" id="login">
      <div className="lp-visual">
        <LoginArt />
      </div>

      <div className="lp-panel">
        <LoginForm />

        <p className="lp-foot">
          © {new Date().getFullYear()} Fedy Fs. Gerana · v
          {APP_VERSION}
        </p>
      </div>
    </section>
  );
}
