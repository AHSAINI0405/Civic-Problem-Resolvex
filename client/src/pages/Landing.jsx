import { Link } from 'react-router-dom';
import { Shield, MapPin, Zap, ArrowRight, Activity } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo fade-in-up">
          <img src="/Logo.png" alt="Resolvex" />
          <span>Resolvex</span>
        </div>
        <div className="landing-nav-links fade-in-up">
          <Link to="/login" className="btn btn-ghost">Login</Link>
          <Link to="/signup" className="btn btn-primary">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="hero-badge fade-in-up">
          <Zap size={16} /> Empowering Citizens, Transforming Cities
        </div>
        
        <h1 className="hero-title fade-in-up" style={{ animationDelay: '0.1s' }}>
          Civic Issues Resolved <br />
          <span className="hero-title-highlight">Intelligently.</span>
        </h1>
        
        <p className="hero-subtitle fade-in-up" style={{ animationDelay: '0.2s' }}>
          Resolvex leverages AI to classify, route, and resolve municipal complaints in record time. Report issues, track progress, and build a better community together.
        </p>

        <div className="hero-actions fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Report an Issue <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg">
            Track Existing Complaint
          </Link>
        </div>

        {/* Features Grid */}
        <div className="features-grid fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Activity size={24} />
            </div>
            <h3 className="feature-title">AI-Powered Routing</h3>
            <p className="feature-desc">Smart algorithms automatically classify and assign your complaints to the right department instantly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <MapPin size={24} />
            </div>
            <h3 className="feature-title">Precise Geolocation</h3>
            <p className="feature-desc">Pinpoint issues exactly where they happen. Live map integration ensures workers know exactly where to go.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Shield size={24} />
            </div>
            <h3 className="feature-title">Transparent Tracking</h3>
            <p className="feature-desc">Real-time status updates from submission to resolution. Total transparency into municipal operations.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Resolvex. All rights reserved.</p>
      </footer>
    </div>
  );
}
