import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Shield,
  Bell,
  ChevronRight,
  Check,
  Mail,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Church Profiles",
    description:
      "Set up your church profile with a name, custom slug, and description. Everything in one organised place.",
  },
  {
    icon: Users,
    title: "Member Management",
    description:
      "Invite members by email with secure token links. View and manage your entire congregation with ease.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Assign Admin or Member roles to control what each person can see and do within your church.",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description:
      "Stay informed with instant in-app notifications for membership changes and church announcements.",
  },
  {
    icon: Mail,
    title: "Email Invitations",
    description:
      "Send branded invite emails to new members. They join your church with a single secure click.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description:
      "Enterprise-grade security with JWT authentication, email verification, and HTTP-only cookies.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create an Account",
    description: "Sign up in seconds — no credit card, no commitment.",
  },
  {
    number: "02",
    title: "Set Up Your Church",
    description:
      "Add your church name, a unique slug, and an optional description.",
  },
  {
    number: "03",
    title: "Invite Your Community",
    description:
      "Send email invites to members and assign them the right roles instantly.",
  },
];

const stats = [
  { value: "Free", label: "To get started" },
  { value: "Secure", label: "JWT + HTTP-only cookies" },
  { value: "Fast", label: "Real-time WebSocket updates" },
  { value: "Simple", label: "Up and running in minutes" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">MultipliChurch</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gap-1.5">
                Get Started
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-b from-accent/40 to-white">
        <div className="max-w-7xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Free to use — no credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Church management
            <br />
            <span className="text-primary">made simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            MultipliChurch gives church leaders the tools to manage members,
            send secure email invites, and grow their community — all in one
            place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="h-12 px-8 text-base gap-2">
                Start for free
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-extrabold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything your church needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Purpose-built for church leaders who want clarity, control, and
              community.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-7 rounded-2xl border bg-white hover:shadow-lg hover:border-primary/25 transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-accent/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Get started in 3 steps
            </h2>
            <p className="text-lg text-muted-foreground">
              Up and running in minutes, not hours.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center">
                <div className="inline-flex h-16 w-16 rounded-2xl bg-primary text-white text-xl font-bold items-center justify-center mb-6">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl bg-primary px-10 py-16 md:py-20 text-white text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to grow your church community?
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              Join church leaders using MultipliChurch to build stronger, more
              connected communities.
            </p>
            <Link to="/register">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-10 text-base font-semibold gap-2"
              >
                Create your free account
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex flex-wrap gap-6 justify-center mt-10 text-white/70 text-sm">
              {[
                "No credit card required",
                "Free to use",
                "Secure & private",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-white/90" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1 space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg">MultipliChurch</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The all-in-one platform for church community management.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-5">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-foreground transition-colors"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="hover:text-foreground transition-colors"
                  >
                    Get started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-5">Account</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-foreground transition-colors"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="hover:text-foreground transition-colors"
                  >
                    Create account
                  </Link>
                </li>
                <li>
                  <Link
                    to="/forgot-password"
                    className="hover:text-foreground transition-colors"
                  >
                    Forgot password
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-5">Platform</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/admin/login"
                    className="hover:text-foreground transition-colors"
                  >
                    Admin portal
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} MultipliChurch. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Privacy Policy
              </span>
              <span className="hover:text-foreground cursor-pointer transition-colors">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
