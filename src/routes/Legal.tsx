import { Link } from 'react-router-dom';

/**
 * Public legal pages. The privacy policy URL is required to publish
 * the Google sign-in consent screen (2026-10-16); both pages state,
 * plainly and truthfully, what the app actually does today.
 */
function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-paper-50">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link to="/" className="text-sm font-semibold text-teal-600">
          ← Crux8
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-ink-900">{title}</h1>
        <p className="mt-1 text-sm text-ink-500">Last updated: {updated}</p>
        <div className="mt-6 flex flex-col gap-5 text-[15px] leading-relaxed text-ink-700 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink-900">
          {children}
        </div>
        <p className="mt-10 border-t border-ink-100 pt-4 text-sm text-ink-500">
          Questions: <a className="font-medium text-teal-600" href="mailto:support@glomere.tech">support@glomere.tech</a>
        </p>
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalShell title="Privacy Policy" updated="October 16, 2026">
      <p>
        Crux8 is a climbing-community app operated by Glomere Inc. ("we", "us"). This policy
        describes what information the app collects, how it is used, and the choices you have.
      </p>
      <div>
        <h2>What we collect</h2>
        <p>
          <b>Account information.</b> Your email address and, if you sign in with Google, your
          name and profile picture from Google. If you join as a guest, only the display name
          you choose.
        </p>
        <p>
          <b>Profile information.</b> The display name, photo or avatar, home gym, climbing
          grades, and preferences you add to your profile.
        </p>
        <p>
          <b>Activity.</b> The climbing sessions and climb calls you create or join, the crews
          and cruxmates you connect with, and your gym check-ins (the gym you check in to — we
          do not track your precise location).
        </p>
      </div>
      <div>
        <h2>How we use it</h2>
        <p>
          Your information is used to run the app: showing your profile to other climbers,
          matching you with sessions and cruxmates, and sending account emails such as sign-in
          codes and password resets. Other signed-in users can see your display name, photo,
          grades, and home gym so they can find climbing partners — that visibility is the
          point of a community app.
        </p>
      </div>
      <div>
        <h2>What we never do</h2>
        <p>
          We do not sell your personal information. We do not use it for advertising, and we do
          not share it with third parties except the infrastructure providers below.
        </p>
      </div>
      <div>
        <h2>Service providers</h2>
        <p>
          We use Supabase to host accounts and app data, Resend to deliver account emails, and
          Vercel to serve the app. If you sign in with Google, Google verifies your identity
          and shares your name, email, and profile picture with us.
        </p>
      </div>
      <div>
        <h2>Your choices</h2>
        <p>
          You can edit or remove your profile information in the app at any time. To delete your
          account and its data, email us at support@glomere.tech and we will remove it.
        </p>
      </div>
    </LegalShell>
  );
}

export function TermsOfService() {
  return (
    <LegalShell title="Terms of Service" updated="October 16, 2026">
      <p>
        Crux8 is a community app by Glomere Inc. for finding climbing partners and sessions.
        By using Crux8 you agree to these terms.
      </p>
      <div>
        <h2>Your account</h2>
        <p>
          You are responsible for your account and for keeping your sign-in credentials safe.
          You must be at least 13 years old to use Crux8.
        </p>
      </div>
      <div>
        <h2>Community conduct</h2>
        <p>
          Be respectful to other climbers. Do not harass others, post misleading sessions, or
          use Crux8 for spam or unlawful purposes. We may remove content or accounts that
          violate these terms.
        </p>
      </div>
      <div>
        <h2>Climbing safety</h2>
        <p>
          Climbing is an inherently risky activity. Crux8 connects people; it does not verify
          any user's skill, certifications, or belay competence, and self-reported or
          peer-confirmed badges in the app are community signals, not guarantees. You are
          responsible for your own safety checks, gear, and judgment at the gym and outdoors,
          and for following each facility's rules.
        </p>
      </div>
      <div>
        <h2>The service</h2>
        <p>
          Crux8 is provided "as is" during its beta period. Features may change, and the
          service may occasionally be unavailable. To the extent permitted by law, Glomere Inc.
          is not liable for injuries, losses, or disputes arising from sessions or meetings
          arranged through the app.
        </p>
      </div>
      <div>
        <h2>Changes</h2>
        <p>
          We may update these terms; continued use of Crux8 after an update means you accept
          the revised terms.
        </p>
      </div>
    </LegalShell>
  );
}
