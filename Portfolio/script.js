document.documentElement.classList.add("js-enabled");

document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------
  // Config
  // -----------------------------
  const CONTACT_EMAIL = "mharriskhalid@gmail.com";
  // Serverless endpoint that forwards messages to Discord (and email, if configured).
  // The Discord webhook URL lives in a Netlify environment variable, never in this file.
  const CONTACT_ENDPOINT = "/.netlify/functions/contact";
  const SEND_COOLDOWN_MS = 30000;

  // -----------------------------
  // Helpers
  // -----------------------------
  const toast = document.getElementById("toast");
  let toastTimer;

  const showToast = (content, duration = 7000) => {
    if (!toast) return;
    toast.replaceChildren();
    if (typeof content === "string") {
      toast.textContent = content;
    } else {
      toast.appendChild(content);
    }
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
  };

  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      /* fall through to legacy copy */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  };

  const buildMailto = ({ subject = "", body = "" }) =>
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const buildGmail = ({ subject = "", body = "" }) =>
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(CONTACT_EMAIL)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  // If no mail app handles mailto: (common in mobile in-app browsers), the page
  // stays focused. In that case copy the address and offer a Gmail web link.
  const showMailFallback = async (mail, lead = "No email app opened.") => {
    const copied = await copyText(CONTACT_EMAIL);

    const wrap = document.createElement("div");
    wrap.appendChild(
      document.createTextNode(
        `${lead} ${copied ? "Address copied: " : "Email me at: "}${CONTACT_EMAIL}  `
      )
    );
    const link = document.createElement("a");
    link.href = buildGmail(mail);
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Open in Gmail";
    wrap.appendChild(link);
    showToast(wrap, 10000);
  };

  const openMailClient = (mail) => {
    let leftPage = false;
    const markLeft = () => {
      leftPage = true;
    };
    window.addEventListener("blur", markLeft, { once: true });
    document.addEventListener("visibilitychange", markLeft, { once: true });
    window.addEventListener("pagehide", markLeft, { once: true });

    window.location.href = buildMailto(mail);

    setTimeout(() => {
      window.removeEventListener("blur", markLeft);
      document.removeEventListener("visibilitychange", markLeft);
      window.removeEventListener("pagehide", markLeft);
      if (!leftPage && !document.hidden) showMailFallback(mail);
    }, 1400);
  };

  // -----------------------------
  // Mobile navigation
  // -----------------------------
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  menuBtn?.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      menuBtn?.setAttribute("aria-expanded", "false");
    });
  });

  // -----------------------------
  // Scroll reveal
  // -----------------------------
  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("active"));
  }

  // -----------------------------
  // Project filters
  // -----------------------------
  const filters = document.querySelectorAll(".filter");
  const projects = document.querySelectorAll(".project-card");

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      filters.forEach((item) => item.classList.remove("active"));
      filter.classList.add("active");

      const selected = filter.dataset.filter;

      projects.forEach((project) => {
        const match =
          selected === "all" || project.dataset.category === selected;

        project.classList.toggle("hidden", !match);
      });
    });
  });

  // -----------------------------
  // Extended Project Modal & Gallery
  // -----------------------------
  const projectData = {
    maisondeiram: {
      type: "SYS_ID: 001 // WEB",
      title: "MAISON DE IRAM",
      description:
        "An elegant, high-end luxury fashion and couture e-commerce experience showcasing curated seasonal collections, bespoke tailoring services, and interactive product lookbooks.",
      tags: ["HTML5", "CSS3", "JavaScript", "Mobile Web", "Netlify"],
      images: [
        "https://api.microlink.io/?url=https%3A%2F%2Fmaisondeiram.netlify.app%2F&screenshot=true&meta=false&embed=screenshot.url"
      ],
      liveUrl: "https://maisondeiram.netlify.app/",
      repoUrl: "https://github.com/mharrisdev"
    },
    cousinkart: {
      type: "SYS_ID: 002 // WEB",
      title: "COUSINKART",
      description:
        "A full-featured e-commerce platform designed for streamlined online shopping, featuring dynamic product listings, interactive cart management, and modern user interface components.",
      tags: ["HTML5", "JavaScript", "CSS3", "Netlify", "Mobile Web"],
      images: [
        "https://api.microlink.io/?url=https%3A%2F%2Fcousinkart.netlify.app%2F&screenshot=true&meta=false&embed=screenshot.url"
      ],
      liveUrl: "https://cousinkart.netlify.app/",
      repoUrl: "https://github.com/mharrisdev"
    },
    vroomgolf: {
      type: "SYS_ID: 003 // APP",
      title: "VROOMGOLF",
      description:
        "A golf-cart rideshare product concept. The system is designed around mobile riders/drivers, real-time ride states, maps, location services, payments, and an administrative dashboard.",
      tags: ["React Native", "Expo", "TypeScript", "Maps", "Realtime"],
      images: [
        "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=1000&q=80"
      ],
      liveUrl: "",
      repoUrl: ""
    },
    fps: {
      type: "SYS_ID: 004 // GAME",
      title: "MOBILE FPS",
      description:
        "A mobile-first FPS experiment focused on first-person movement, sprinting, crouching, combat, environments, and a repeatable survival gameplay loop.",
      tags: ["Godot", "3D", "FPS", "Mobile", "Game Systems"],
      images: [
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80"
      ],
      liveUrl: "",
      repoUrl: ""
    },
    portfolio: {
      type: "SYS_ID: 005 // WEB",
      title: "PORTFOLIO SYSTEM",
      description:
        "A personal portfolio interface combining technical visual language, responsive layout systems, project presentation, subtle motion, and a structured contact experience.",
      tags: ["HTML5", "CSS3", "JavaScript", "UI/UX"],
      images: [
        "https://api.microlink.io/?url=https%3A%2F%2Fportfoliomharrisdev.netlify.app%2F&screenshot=true&meta=false&embed=screenshot.url"
      ],
      liveUrl: "https://portfoliomharrisdev.netlify.app/",
      repoUrl: ""
    },
    support: {
      type: "SYS_ID: 006 // SYSTEMS",
      title: "LIVE SUPPORT PLATFORM",
      description:
        "A customer-support platform concept focused on live conversations, agent workflows, status states, operational tooling, and clean information hierarchy.",
      tags: ["Web", "UI", "Realtime", "Support"],
      images: [
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80"
      ],
      liveUrl: "",
      repoUrl: ""
    }
  };

  const modal = document.getElementById("projectModal");
  const modalClose = document.getElementById("modalClose");
  const modalType = document.getElementById("modalType");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const modalTags = document.getElementById("modalTags");
  const modalMainImage = document.getElementById("modalMainImage");
  const modalThumbnails = document.getElementById("modalThumbnails");
  const modalLiveBtn = document.getElementById("modalLiveBtn");
  const modalRepoBtn = document.getElementById("modalRepoBtn");

  const setModalLink = (el, url) => {
    if (!el) return;
    if (url) {
      el.href = url;
      el.classList.remove("is-hidden");
    } else {
      el.removeAttribute("href");
      el.classList.add("is-hidden");
    }
  };

  const openProjectModal = (projectId) => {
    const data = projectData[projectId];
    if (!data || !modal) return;

    if (modalType) modalType.textContent = data.type;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalDescription) modalDescription.textContent = data.description;

    // Render Tags
    if (modalTags) {
      modalTags.innerHTML = "";
      data.tags.forEach((tag) => {
        const span = document.createElement("span");
        span.textContent = tag;
        modalTags.appendChild(span);
      });
    }

    // Render Images
    if (modalMainImage && modalThumbnails) {
      modalThumbnails.innerHTML = "";
      if (data.images && data.images.length > 0) {
        modalMainImage.src = data.images[0];
        modalMainImage.style.display = "block";

        if (data.images.length > 1) {
          data.images.forEach((imgSrc, idx) => {
            const thumb = document.createElement("img");
            thumb.src = imgSrc;
            thumb.alt = `${data.title} preview ${idx + 1}`;
            if (idx === 0) thumb.classList.add("active");

            thumb.addEventListener("click", () => {
              modalMainImage.src = imgSrc;
              modalThumbnails.querySelectorAll("img").forEach((t) => t.classList.remove("active"));
              thumb.classList.add("active");
            });

            modalThumbnails.appendChild(thumb);
          });
        }
      } else {
        modalMainImage.style.display = "none";
      }
    }

    // Links: hide the button when a project has no URL yet
    setModalLink(modalLiveBtn, data.liveUrl);
    setModalLink(modalRepoBtn, data.repoUrl);

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Block body scroll when open
  };

  // Click handler for entire project cards
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", () => {
      const projectId = card.dataset.project;
      if (projectId) openProjectModal(projectId);
    });
  });

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  modalClose?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  // -----------------------------
  // Direct mail link (bottom of page)
  // -----------------------------
  const directMail = document.getElementById("directMail");

  directMail?.addEventListener("click", (event) => {
    event.preventDefault();
    openMailClient({
      subject: "Portfolio inquiry",
      body: "Hi Harris,\n\n"
    });
  });

  // -----------------------------
  // Contact form: Discord webhook (via serverless function) + email
  // -----------------------------
  const form = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  const sendBtn = document.getElementById("sendBtn");
  const mailBtn = document.getElementById("mailBtn");

  let lastSentAt = 0;

  const setNote = (text, state) => {
    if (!formNote) return;
    formNote.textContent = `> ${text}`;
    formNote.classList.remove("is-sending", "is-success", "is-error");
    if (state) formNote.classList.add(state);
  };

  const readForm = () => {
    const fd = new FormData(form);
    return {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      subject: String(fd.get("subject") || "").trim(),
      message: String(fd.get("message") || "").trim(),
      website: String(fd.get("website") || "") // honeypot
    };
  };

  // Limit input lengths on the client too (the function enforces them again)
  if (form) {
    form.elements.name && (form.elements.name.maxLength = 80);
    form.elements.email && (form.elements.email.maxLength = 120);
    form.elements.subject && (form.elements.subject.maxLength = 120);
    form.elements.message && (form.elements.message.maxLength = 3000);
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = readForm();

    // Bots fill the hidden field. Pretend success and drop it.
    if (data.website) {
      setNote("transmission_complete: message_sent", "is-success");
      form.reset();
      return;
    }

    const wait = SEND_COOLDOWN_MS - (Date.now() - lastSentAt);
    if (wait > 0) {
      setNote(`cooldown_active: retry in ${Math.ceil(wait / 1000)}s`, "is-error");
      return;
    }

    sendBtn.disabled = true;
    setNote("transmitting...", "is-sending");

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message
        })
      });

      let result = {};
      try {
        result = await res.json();
      } catch (_) {
        /* non-JSON response (e.g. 404 when the function is not deployed) */
      }

      if (!res.ok || !result.ok) {
        throw new Error(result.error || `HTTP ${res.status}`);
      }

      lastSentAt = Date.now();
      setNote("transmission_complete: message_sent", "is-success");
      showToast("Message sent. I'll get back to you soon.");
      form.reset();
    } catch (err) {
      setNote("transmission_failed: use the email button below", "is-error");
      showMailFallback(
        {
          subject: data.subject || "Portfolio inquiry",
          body: `${data.message}\n\n- ${data.name} (${data.email})`
        },
        "Couldn't send the message."
      );
    } finally {
      sendBtn.disabled = false;
    }
  });

  // "Send via my email app": prefilled mailto with the form contents
  mailBtn?.addEventListener("click", () => {
    if (!form) return;
    if (!form.reportValidity()) return;

    const data = readForm();
    const body = `${data.message}\n\n- ${data.name} (${data.email})`.slice(0, 1800);

    openMailClient({
      subject: data.subject || "Portfolio inquiry",
      body
    });
  });
});
