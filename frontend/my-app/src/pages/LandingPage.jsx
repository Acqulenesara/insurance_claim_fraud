import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, ArrowRight } from "lucide-react";

const LandingPage = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  const handleUserClick = () => {
    navigate("/user-login");
  };

  const handleAdminClick = () => {
    navigate("/admin-login");
  };

  const styles = {
    container: {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #0f1729 0%, #1e293b 25%, #0f172a 50%, #1e3a8a 75%, #0f1729 100%)",
  display: "flex",
  paddingTop: "80px",  // ✅ camelCase + unit
  alignItems: "center",
  justifyContent: "center",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  position: "relative",
  overflow: "hidden",
},

    backgroundPattern: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `
  radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
  radial-gradient(circle at 40% 40%, rgba(147, 197, 253, 0.05) 0%, transparent 50%)
`,

      animation: "float 20s ease-in-out infinite",
    },
    particles: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
    },
    particle: {
      position: "absolute",
      width: "2px",
      height: "2px",
      backgroundColor: "rgba(147, 197, 253, 0.3)",
      borderRadius: "50%",
      animation: "twinkle 4s ease-in-out infinite",
    },
    mainContent: {
      position: "relative",
      zIndex: 10,
      textAlign: "center",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "2rem",
    },
    title: {
      fontSize: "4rem",
      fontWeight: "900",
      background: "linear-gradient(45deg, #60a5fa, #3b82f6, #1d4ed8)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "1rem",
      textShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
      animation: "glow 3s ease-in-out infinite alternate",
    },
    subtitle: {
      fontSize: "1.25rem",
      color: "#cbd5e1",
      marginBottom: "4rem",
      maxWidth: "600px",
      margin: "0 auto 4rem auto",
      lineHeight: "1.6",
    },
    cardsContainer: {
      display: "flex",
      gap: "3rem",
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "wrap",
    },
    cardWrapper: {
      position: "relative",
      cursor: "pointer",
      transition:
        "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    },
    cardWrapperHover: {
      transform: "translateY(-10px) scale(1.05)",
    },
    cardGlow: {
      position: "absolute",
      top: "-2px",
      left: "-2px",
      right: "-2px",
      bottom: "-2px",
      borderRadius: "20px",
      opacity: 0,
      transition: "opacity 0.4s ease",
      filter: "blur(8px)",
    },
    cardGlowUser: {
      background:
        "linear-gradient(45deg, #3b82f6, #1d4ed8, #1e40af)",
    },
    cardGlowAdmin: {
      background:
        "linear-gradient(45deg, #1d4ed8, #1e3a8a, #172554)",
    },
    cardGlowHover: {
      opacity: 0.8,
    },
    card: {
      position: "relative",
      width: "320px",
      height: "400px",
      background: "rgba(15, 23, 42, 0.8)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(59, 130, 246, 0.2)",
      borderRadius: "20px",
      padding: "2.5rem 2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      boxShadow:
        "0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1)",
      transition: "all 0.4s ease",
      overflow: "hidden",
    },
    cardHover: {
      border: "1px solid rgba(59, 130, 246, 0.5)",
      boxShadow:
        "0 35px 80px rgba(59, 130, 246, 0.15), 0 0 50px rgba(59, 130, 246, 0.1)",
    },
    cardOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background:
        "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)",
      opacity: 0,
      transition: "opacity 0.4s ease",
      borderRadius: "20px",
    },
    cardOverlayHover: {
      opacity: 1,
    },
    iconContainer: {
      position: "relative",
      marginBottom: "2rem",
    },
    iconGlow: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "120px",
      height: "120px",
      background:
        "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
      borderRadius: "50%",
      opacity: 0,
      transition: "opacity 0.4s ease",
      filter: "blur(10px)",
    },
    iconGlowHover: {
      opacity: 1,
    },
    iconWrapper: {
      position: "relative",
      width: "80px",
      height: "80px",
      background:
        "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)",
      transition: "transform 0.3s ease",
    },
    iconWrapperHover: {
      transform: "scale(1.1) rotateY(10deg)",
    },
    cardTitle: {
      fontSize: "1.75rem",
      fontWeight: "700",
      color: "#f8fafc",
      marginBottom: "1rem",
      transition: "color 0.3s ease",
    },
    cardTitleHover: {
      color: "#93c5fd",
    },
    cardDescription: {
      color: "#94a3b8",
      fontSize: "0.95rem",
      lineHeight: "1.6",
      marginBottom: "2rem",
      textAlign: "center",
    },
    actionContainer: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      color: "#60a5fa",
      fontSize: "0.95rem",
      fontWeight: "600",
      transition: "all 0.3s ease",
    },
    actionContainerHover: {
      color: "#93c5fd",
      transform: "translateX(5px)",
    },
    footer: {
      marginTop: "clamp(2rem, 5vh, 3rem)",
      color: "#64748b",
      fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
    },
  };

  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100 + "%",
    top: Math.random() * 100 + "%",
    animationDelay: Math.random() * 10 + "s",
    animationDuration: Math.random() * 5 + 5 + "s",
  }));

  return (
    <div style={styles.container}>
      {/* Background Pattern */}
      <div style={styles.backgroundPattern}></div>

      {/* Particles */}
      <div style={styles.particles}>
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              ...styles.particle,
              left: p.left,
              top: p.top,
              animationDelay: p.animationDelay,
              animationDuration: p.animationDuration,
            }}
          ></div>
        ))}
      </div>

      <div style={styles.mainContent}>
        {/* Main Title */}
        <h1 style={styles.title}>Welcome</h1>
        <p style={styles.subtitle}>
          Choose your role to access the platform and explore amazing features
          tailored for your needs
        </p>

        {/* Cards */}
        <div style={styles.cardsContainer}>
          {/* User Card */}
          <div
            style={{
              ...styles.cardWrapper,
              ...(hoveredCard === "user" ? styles.cardWrapperHover : {}),
            }}
            onClick={handleUserClick}
            onMouseEnter={() => setHoveredCard("user")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div
              style={{
                ...styles.cardGlow,
                ...styles.cardGlowUser,
                ...(hoveredCard === "user" ? styles.cardGlowHover : {}),
              }}
            ></div>

            <div
              style={{
                ...styles.card,
                ...(hoveredCard === "user" ? styles.cardHover : {}),
              }}
            >
              <div
                style={{
                  ...styles.cardOverlay,
                  ...(hoveredCard === "user" ? styles.cardOverlayHover : {}),
                }}
              ></div>

              <div style={styles.iconContainer}>
                <div
                  style={{
                    ...styles.iconGlow,
                    ...(hoveredCard === "user" ? styles.iconGlowHover : {}),
                  }}
                ></div>
                <div
                  style={{
                    ...styles.iconWrapper,
                    ...(hoveredCard === "user" ? styles.iconWrapperHover : {}),
                  }}
                >
                  <User size={32} color="white" />
                </div>
              </div>

              <h2
                style={{
                  ...styles.cardTitle,
                  ...(hoveredCard === "user" ? styles.cardTitleHover : {}),
                }}
              >
                User Portal
              </h2>
              <p style={styles.cardDescription}>
                Access your personal dashboard, manage your profile, and explore
                features built for you
              </p>

              <div
                style={{
                  ...styles.actionContainer,
                  ...(hoveredCard === "user"
                    ? styles.actionContainerHover
                    : {}),
                }}
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Admin Card */}
          <div
            style={{
              ...styles.cardWrapper,
              ...(hoveredCard === "admin" ? styles.cardWrapperHover : {}),
            }}
            onClick={handleAdminClick}
            onMouseEnter={() => setHoveredCard("admin")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div
              style={{
                ...styles.cardGlow,
                ...styles.cardGlowAdmin,
                ...(hoveredCard === "admin" ? styles.cardGlowHover : {}),
              }}
            ></div>

            <div
              style={{
                ...styles.card,
                ...(hoveredCard === "admin" ? styles.cardHover : {}),
              }}
            >
              <div
                style={{
                  ...styles.cardOverlay,
                  ...(hoveredCard === "admin" ? styles.cardOverlayHover : {}),
                }}
              ></div>

              <div style={styles.iconContainer}>
                <div
                  style={{
                    ...styles.iconGlow,
                    ...(hoveredCard === "admin" ? styles.iconGlowHover : {}),
                  }}
                ></div>
                <div
                  style={{
                    ...styles.iconWrapper,
                    ...(hoveredCard === "admin" ? styles.iconWrapperHover : {}),
                  }}
                >
                  <Shield size={32} color="white" />
                </div>
              </div>

              <h2
                style={{
                  ...styles.cardTitle,
                  ...(hoveredCard === "admin" ? styles.cardTitleHover : {}),
                }}
              >
                Company Portal
              </h2>
              <p style={styles.cardDescription}>
                Manage operations, oversee users, and access powerful tools
              </p>

              <div
                style={{
                  ...styles.actionContainer,
                  ...(hoveredCard === "admin"
                    ? styles.actionContainerHover
                    : {}),
                }}
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>Secure • Reliable • Modern Platform</p>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes glow {
            0% { text-shadow: 0 0 30px rgba(59, 130, 246, 0.3); }
            100% { text-shadow: 0 0 50px rgba(59, 130, 246, 0.6), 0 0 70px rgba(59, 130, 246, 0.4); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-20px) rotate(1deg); }
            66% { transform: translateY(-10px) rotate(-1deg); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;
