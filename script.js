// Rines Secondary School - Refactored JavaScript
// Modular, defensive, performance-minded, and mobile-friendly.

(function () {
  'use strict';

  const supportsDOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof document.querySelector === 'function';
  if (!supportsDOM) return;

  const prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const safe = (fn) => {
    try {
      fn();
    } catch (e) {
      // silent
    }
  };

  // ------------------------------
  // Animations
  // ------------------------------
  const Animations = {
    initReveal() {
      if (prefersReducedMotion) return;

      const targets = $$(
        'section, .feature-card, .gallery-item, .promise-card, .leader-profile-card, .timeline-card, .achievement-highlight-card'
      ).filter((el) => !el.classList.contains('student-outcomes'));

      if (!targets.length) return;

      targets.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            observer.unobserve(el);
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      targets.forEach((el) => observer.observe(el));
    },

    initTimelineActive() {
      if (prefersReducedMotion) return;

      const cards = $$('.timeline-card');
      if (!cards.length) return;

      let active = null;

      const obs = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting);
          if (!visible.length) return;

          visible.sort((a, b) => (b.intersectionRatio - a.intersectionRatio));
          const top = visible[0].target;

          if (active && active !== top) active.classList.remove('is-active');
          top.classList.add('is-active');
          active = top;
        },
        { threshold: [0.2, 0.35, 0.5] }
      );

      cards.forEach((c) => obs.observe(c));
    },

    initCounters() {
      const statEls = $$('.stat-number');
      if (!statEls.length) return;

      const sections = ['.student-outcomes', '.academics-performance']
        .map((s) => $(s))
        .filter(Boolean);

      if (!sections.length) return;

      statEls.forEach((el) => {
        el.dataset.rendered = el.dataset.rendered === 'true' ? 'true' : 'false';
      });

      const setStat = (el, finalValue, suffix) => {
        el.textContent = `${finalValue}${suffix}`;
      };

      const animateStat = (el, finalValue, suffix, duration = 900) => {
        const startValue = 0;
        const startTime = performance.now();
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const step = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = easeOutCubic(progress);
          const currentValue = Math.round(startValue + (finalValue - startValue) * eased);
          el.textContent = `${currentValue}${suffix}`;
          if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
      };

      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            statEls.forEach((el) => {
              if (el.dataset.rendered === 'true') return;

              const target = Number(el.dataset.target || '0');
              const suffix = el.dataset.suffix || '';

              if (prefersReducedMotion) setStat(el, target, suffix);
              else animateStat(el, target, suffix);

              el.dataset.rendered = 'true';
            });
          });
        },
        { threshold: 0.25 }
      );

      sections.forEach((s) => obs.observe(s));
    }
  };

  // ------------------------------
  // Navbar
  // ------------------------------
  const Nav = {
    initMobileMenu() {
      const hamburger = $('.hamburger');
      const navMenu = $('.nav-menu');
      if (!hamburger || !navMenu) return;

      const toggle = () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      };

      hamburger.addEventListener('click', toggle);

      navMenu.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      });
    },

    initSmoothScrolling() {
      $$('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
          const href = this.getAttribute('href');
          if (!href || href === '#') return;

          const target = document.querySelector(href);
          if (!target) return;

          e.preventDefault();
          try {
            target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
          } catch {
            target.scrollIntoView(true);
          }
        });
      });
    },

    initNavbarScrollEffect() {
      const navbar = $('.navbar');
      if (!navbar) return;

      let ticking = false;
      const apply = () => {
        const y = window.scrollY || 0;
        if (y > 50) {
          navbar.style.background = 'rgba(255,255,255,0.98)';
          navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
        } else {
          navbar.style.background = 'rgba(255,255,255,0.95)';
          navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
        }
      };

      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          ticking = false;
          apply();
        });
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      apply();
    }
  };

  // ------------------------------
  // Academics (subject drawer + filter)
  // ------------------------------
  const Academics = {
    init() {
      const drawer = $('.subject-drawer');
      if (!drawer) return;

      const drawerLevelEl = $('#subject-drawer-level');
      const drawerMetaEl = $('#subject-drawer-meta');
      const drawerDescriptionEl = $('#subject-drawer-description');
      const drawerKeypointsEl = $('#subject-drawer-keypoints');
      const drawerDownloadEl = $('#subject-drawer-download');

      const drawerCloseEls = $$('[data-drawer-close]');
      const subjectCards = $$('.subject-card[data-subject]');
      if (!subjectCards.length) return;

      const SUBJECTS = {
        'Math': { levels: 'O-Level & A-Level', description: 'Builds logical reasoning, quantitative problem solving, and mathematical literacy through problem-based learning.', keypoints: ['Problem-solving approach', 'Algebra & Geometry focus', 'Application in real-world scenarios'], downloadHint: 'curriculum/o-level-math.pdf' },
        'Agriculture': { levels: 'O-Level', description: 'Develops agricultural knowledge and practical skills through observation, field work, and scientific thinking.', keypoints: ['Crop & livestock fundamentals', 'Practical farm exercises', 'Sustainability and innovation'], downloadHint: 'curriculum/o-level-agriculture.pdf' },
        'History': { levels: 'O-Level', description: 'Strengthens critical analysis of events, causes and consequences through guided reading and structured discussion.', keypoints: ['Source-based learning', 'Chronology and themes', 'Essay and interpretation skills'], downloadHint: 'curriculum/o-level-history.pdf' },
        'Physics': { levels: 'O-Level', description: 'Explores motion, energy and forces using experiments and inquiry-based learning to build scientific understanding.', keypoints: ['Experiment-led lessons', 'Problem practice', 'Conceptual mastery'], downloadHint: 'curriculum/o-level-physics.pdf' },
        'IRE/Islam': { levels: 'O-Level', description: 'Nurtures spiritual development, ethical reasoning, and understanding of faith practices and values.', keypoints: ['Ethics and character', 'Scripture understanding', 'Reflective learning'], downloadHint: 'curriculum/o-level-ire.pdf' },
        'Art and Design': { levels: 'O-Level', description: 'Supports creativity through drawing, design processes and structured studio practice.', keypoints: ['Design thinking', 'Sketching & composition', 'Practical studio projects'], downloadHint: 'curriculum/o-level-art-design.pdf' },
        'Geography': { levels: 'O-Level', description: 'Builds spatial awareness and environmental understanding using maps, data interpretation and field examples.', keypoints: ['Map & data skills', 'Human/environment systems', 'Case studies'], downloadHint: 'curriculum/o-level-geography.pdf' },
        'Physical Education': { levels: 'O-Level', description: 'Improves health, discipline and teamwork through sports, fitness routines and practical coaching.', keypoints: ['Fitness & skill development', 'Teamwork focus', 'Safety-first training'], downloadHint: 'curriculum/o-level-pe.pdf' },
        'Entrepreneurship': { levels: 'O-Level & A-Level', description: 'Teaches practical entrepreneurship with problem identification, planning, and basic business development skills.', keypoints: ['Business basics', 'Practical projects', 'Innovation & leadership'], downloadHint: 'curriculum/entrepreneurship.pdf' },
        'Technology and Design': { levels: 'O-Level', description: 'Develops design thinking and practical technology skills through prototyping and creative problem-solving.', keypoints: ['Design process', 'Prototyping', 'Evaluation & iteration'], downloadHint: 'curriculum/o-level-technology-design.pdf' },
        'Biology': { levels: 'O-Level', description: 'Focuses on living systems through observation, experiments and interpretation of scientific evidence.', keypoints: ['Lab and observation', 'Body systems & ecology', 'Experiment-based understanding'], downloadHint: 'curriculum/o-level-biology.pdf' },
        'English': { levels: 'O-Level & A-Level', description: 'Improves reading, writing, speaking and communication skills through guided practice and meaningful texts.', keypoints: ['Reading comprehension', 'Writing frameworks', 'Confident speaking'], downloadHint: 'curriculum/o-level-english.pdf' },
        'Performing Arts': { levels: 'O-Level', description: 'Develops confidence and creativity through dance, music, drama and performance coaching.', keypoints: ['Stage performance skills', 'Team rehearsals', 'Creative expression'], downloadHint: 'curriculum/o-level-performing-arts.pdf' },
        'Food and Nutrition': { levels: 'O-Level', description: 'Builds knowledge of nutrition and healthy living through practical guidance and learning-by-doing.', keypoints: ['Nutrition basics', 'Healthy meal planning', 'Practical food prep'], downloadHint: 'curriculum/o-level-food-nutrition.pdf' },
        'Chemistry': { levels: 'O-Level', description: 'Teaches matter, reactions and scientific thinking through safe experiments and structured problem practice.', keypoints: ['Concept + practical lab', 'Reaction understanding', 'Exam-style questions'], downloadHint: 'curriculum/o-level-chemistry.pdf' },
        'Information and Communication Technology (ICT)': { levels: 'O-Level', description: 'Develops digital literacy, responsible technology use, and applied computing skills.', keypoints: ['Digital productivity', 'Programming basics', 'Practical ICT projects'], downloadHint: 'curriculum/o-level-ict.pdf' }
      };

      const openDrawer = (subjectName) => {
        const subject = SUBJECTS[subjectName];
        const levels = subject?.levels || 'O-Level';
        const description = subject?.description || 'A curriculum overview focused on practical skills and competence development.';
        const keypoints = subject?.keypoints || ['Competence-based learning', 'Continuous assessment', 'Guided practice'];
        const downloadHint = subject?.downloadHint || 'curriculum/subject-guide.pdf';

        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');

        if (drawerLevelEl) drawerLevelEl.textContent = levels;
        if (drawerMetaEl) drawerMetaEl.textContent = `Selected subject: ${subjectName}`;
        if (drawerDescriptionEl) drawerDescriptionEl.textContent = description;

        if (drawerKeypointsEl) {
          drawerKeypointsEl.innerHTML = '';
          keypoints.forEach((kp) => {
            const li = document.createElement('li');
            li.textContent = kp;
            drawerKeypointsEl.appendChild(li);
          });
        }

        if (drawerDownloadEl) {
          drawerDownloadEl.href = downloadHint;
          drawerDownloadEl.setAttribute('download', `${subjectName}-curriculum-guide.pdf`);
        }

        const closeBtn = drawer.querySelector('[data-drawer-close]');
        closeBtn?.focus();
      };

      const closeDrawer = () => {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
      };

      drawerCloseEls.forEach((el) => el.addEventListener('click', closeDrawer));

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
      }, { passive: true });

      // Delegated open
      document.addEventListener('click', (e) => {
        const card = e.target.closest('.subject-card[data-subject]');
        if (!card) return;
        openDrawer(card.dataset.subject);
      }, { passive: true });

      // Delegated keyboard open
      document.addEventListener('keydown', (e) => {
        const card = e.target.closest('.subject-card[data-subject]');
        if (!card) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDrawer(card.dataset.subject);
        }
      });

      // Filter chips (if present)
      const filterBtns = $$('.filter-btn[data-filter]');
      const applyFilter = (filterValue) => {
        subjectCards.forEach((card) => {
          const levels = (card.dataset.levels || '').toLowerCase();
          let show = true;
          if (filterValue === 'o-level') show = levels.includes('o-level');
          else if (filterValue === 'a-level') show = levels.includes('a-level');
          else if (filterValue === 'assessment') show = true;

          card.style.display = show ? '' : 'none';
          card.setAttribute('aria-hidden', show ? 'false' : 'true');
        });
      };

      if (filterBtns.length) {
        const activeChip = $('.filter-btn.active[data-filter]');
        if (activeChip) applyFilter(activeChip.dataset.filter);

        document.addEventListener('click', (e) => {
          const btn = e.target.closest('.filter-btn[data-filter]');
          if (!btn) return;
          filterBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          applyFilter(btn.dataset.filter);
        }, { passive: true });

        document.addEventListener('keydown', (e) => {
          const btn = e.target.closest('.filter-btn[data-filter]');
          if (!btn) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
          }
        });
      }
    }
  };

  // ------------------------------
  // Blog & News
  // ------------------------------
  const BlogNews = {
    init() {
      const root = $('#content-grid');
      if (!root) return;

      const filterBtns = $$('.filter-btn[data-filter]');
      const categoryChips = $$('.chip[data-category]');
      const cards = $$('#content-grid .content-card');
      if (!cards.length) return;

      const searchInput = $('#search-content');
      const clearSearchBtn = $('#clear-search');
      const resetFiltersBtn = $('#reset-filters');
      const emptyStateEl = $('#search-empty');
      const resultsCountEl = $('#results-count');

      const authorModal = $('#author-modal');
      const authorModalBackdrop = authorModal?.querySelector('.author-modal-backdrop');
      const authorModalClose = $('#author-modal-close');
      const authorNameEl = $('#author-name');
      const authorRoleEl = $('#author-role');
      const authorBioEl = $('#author-bio');
      const authorAvatarEl = $('#author-avatar');
      const authorPostsList = $('#author-modal-posts-list');

      const state = { contentType: 'all', category: 'all', query: '' };

      const normalize = (s) => (s || '').toString().toLowerCase().trim();

      const getCardText = (card) => {
        const title = card.dataset.title || '';
        const excerpt = card.dataset.excerpt || '';
        const author = card.dataset.author || '';
        const category = card.dataset.category || '';
        return normalize([title, excerpt, author, category].join(' '));
      };

      const applyFilters = () => {
        const query = normalize(state.query);
        let shown = 0;

        cards.forEach((card) => {
          const type = card.getAttribute('data-type') || '';
          const category = card.getAttribute('data-category') || 'all';
          const text = getCardText(card);

          const matchType = state.contentType === 'all' || type === state.contentType;
          const matchCategory = state.category === 'all' || normalize(category) === normalize(state.category);
          const matchQuery = !query || text.includes(query);

          const visible = matchType && matchCategory && matchQuery;
          card.style.display = visible ? '' : 'none';
          if (visible) shown++;
        });

        if (resultsCountEl) resultsCountEl.textContent = `Showing ${shown}`;

        const anyActive = state.contentType !== 'all' || state.category !== 'all' || !!state.query;
        if (resetFiltersBtn) resetFiltersBtn.style.display = anyActive ? '' : 'none';

        if (emptyStateEl) emptyStateEl.hidden = shown !== 0;
      };

      const setActiveFilter = (btn) => {
        filterBtns.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        state.contentType = btn.getAttribute('data-filter') || 'all';
      };

      const setActiveCategory = (btn) => {
        categoryChips.forEach((c) => {
          const active = c === btn;
          c.classList.toggle('active', active);
          c.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        state.category = btn.getAttribute('data-category') || 'all';
      };

      const closeAuthorModal = () => {
        if (!authorModal) return;
        authorModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      };

      const openAuthorModal = (authorName) => {
        if (!authorModal) return;

        const cardsByAuthor = cards.filter((c) => normalize(c.dataset.author) === normalize(authorName));
        const first = cardsByAuthor[0] || null;

        const safeRole = first?.dataset.author || authorName;
        const bio = 'Our staff share knowledge, stories, and updates that keep the school community connected.';

        if (authorNameEl) authorNameEl.textContent = authorName;
        if (authorRoleEl) authorRoleEl.textContent = safeRole;
        if (authorBioEl) authorBioEl.textContent = bio;
        if (authorAvatarEl) authorAvatarEl.textContent = authorName ? authorName.trim().slice(0, 1).toUpperCase() : 'A';

        if (authorPostsList) {
          authorPostsList.innerHTML = '';
          cardsByAuthor.slice(0, 4).forEach((c) => {
            const item = document.createElement('div');
            item.className = 'author-post-item';

            const title = c.dataset.title || c.querySelector('h3')?.textContent || 'Post';
            const date = c.querySelector('.meta-line')?.textContent || '';
            const footer = c.querySelector('.meta-line:last-child')?.textContent || '';

            const metaParts = [date].filter(Boolean);
            if (footer) metaParts.push(footer);

            item.innerHTML = `
              <h4></h4>
              <div class="author-post-meta"></div>
            `;

            item.querySelector('h4').textContent = title;
            item.querySelector('.author-post-meta').textContent = metaParts.join(' • ');

            item.addEventListener('click', () => {
              closeAuthorModal();
              c.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
            });

            authorPostsList.appendChild(item);
          });
        }

        authorModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        authorModalClose?.focus();
      };

      // Delegated filter interactions
      document.addEventListener(
        'click',
        (e) => {
          const filterBtn = e.target.closest('.filter-btn[data-filter]');
          if (filterBtn) {
            setActiveFilter(filterBtn);
            applyFilters();
            return;
          }

          const chip = e.target.closest('.chip[data-category]');
          if (chip) {
            setActiveCategory(chip);
            applyFilters();
          }
        },
        { passive: true }
      );

      if (searchInput) {
        let timer = null;
        searchInput.addEventListener(
          'input',
          () => {
            state.query = searchInput.value || '';
            if (clearSearchBtn) clearSearchBtn.style.display = state.query ? '' : 'none';

            if (timer) clearTimeout(timer);
            timer = setTimeout(applyFilters, 140);
          },
          { passive: true }
        );
      }

      clearSearchBtn?.addEventListener('click', () => {
        if (!searchInput) return;
        searchInput.value = '';
        state.query = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
        searchInput.focus();
      });

      resetFiltersBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.query = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';

        const allBtn = filterBtns.find((b) => b.getAttribute('data-filter') === 'all');
        if (allBtn) setActiveFilter(allBtn);

        const allChip = categoryChips.find((c) => c.getAttribute('data-category') === 'all');
        if (allChip) setActiveCategory(allChip);

        applyFilters();
      });

      document.addEventListener(
        'click',
        (e) => {
          const trigger = e.target.closest('[data-open-author]');
          if (!trigger) return;
          e.preventDefault();
          const author = trigger.getAttribute('data-open-author') || '';
          if (author) openAuthorModal(author);
        },
        { passive: false }
      );

      authorModalClose?.addEventListener('click', closeAuthorModal);
      authorModalBackdrop?.addEventListener('click', closeAuthorModal);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAuthorModal();
      }, { passive: true });

      // Initial active state from markup
      const activeTypeBtn = filterBtns.find((b) => b.classList.contains('active'));
      if (activeTypeBtn) state.contentType = activeTypeBtn.getAttribute('data-filter') || 'all';

      const activeCategoryChip = categoryChips.find((c) => c.classList.contains('active'));
      if (activeCategoryChip) state.category = activeCategoryChip.getAttribute('data-category') || 'all';

      if (clearSearchBtn && searchInput && searchInput.value) clearSearchBtn.style.display = '';
      applyFilters();
    }
  };

  // ------------------------------
  // Contact form
  // ------------------------------
  const ContactForm = {
    init() {
      const form = $('#contactForm') || $('.contact-form');
      if (!form) return;

      const notificationEl = $('#contact-notification');
      const submitBtn = $('#contactSubmit');

      const getField = (id) => ({ input: $('#' + id), err: $('#err-' + id) });

      const fieldMap = {
        fullname: { input: $('#fullname'), err: $('#err-fullname'), required: true, minLen: 2 },
        email: { input: $('#email'), err: $('#err-email'), required: true },
        phone: { input: $('#phone'), err: $('#err-phone'), required: false },
        department: { input: $('#department'), err: $('#err-department'), required: true },
        subject: { input: $('#subject'), err: $('#err-subject'), required: true, minLen: 3 },
        message: { input: $('#message'), err: $('#err-message'), required: true, minLen: 10 }
      };

      const setInvalid = (inputEl, errEl, message) => {
        if (!inputEl) return;
        inputEl.classList.add('form-is-invalid');
        inputEl.setAttribute('aria-invalid', 'true');
        if (errEl) errEl.textContent = message || '';
      };

      const clearInvalid = (inputEl, errEl) => {
        if (!inputEl) return;
        inputEl.classList.remove('form-is-invalid');
        inputEl.removeAttribute('aria-invalid');
        if (errEl) errEl.textContent = '';
      };

      const setNotification = (text, isError) => {
        if (!notificationEl) return;
        notificationEl.hidden = false;
        notificationEl.classList.toggle('is-error', !!isError);
        notificationEl.textContent = text;
      };

      const clearNotification = () => {
        if (!notificationEl) return;
        notificationEl.hidden = true;
        notificationEl.classList.remove('is-error');
        notificationEl.textContent = '';
      };

      const normalizeEmail = (s) => (s || '').trim().toLowerCase();
      const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const isValidPhone = (phone) => {
        const p = (phone || '').trim();
        if (!p) return true;
        return /^\+?[0-9\s\-]{7,}$/.test(p);
      };

      const validateField = (key) => {
        const f = fieldMap[key];
        if (!f?.input) return { ok: true };

        const value = (f.input.value || '').trim();
        let ok = true;
        let msg = '';

        if (key === 'fullname') {
          ok = !f.required || value.length >= (f.minLen || 2);
          msg = 'Please enter your full name (at least 2 characters).';
        } else if (key === 'email') {
          const email = normalizeEmail(value);
          ok = !f.required || (!!email && isValidEmail(email));
          msg = 'Please enter a valid email address.';
        } else if (key === 'phone') {
          ok = isValidPhone(value);
          msg = 'Please enter a valid phone number (or leave it empty).';
        } else if (key === 'department') {
          ok = !f.required || !!value;
          msg = 'Please select a department/topic.';
        } else if (key === 'subject') {
          ok = !f.required || value.length >= (f.minLen || 3);
          msg = 'Subject is required (at least 3 characters).';
        } else if (key === 'message') {
          ok = !f.required || value.length >= (f.minLen || 10);
          msg = 'Message is required (at least 10 characters).';
        }

        if (!ok) setInvalid(f.input, f.err, msg);
        else clearInvalid(f.input, f.err);

        return { ok };
      };

      const validateAll = () => {
        clearNotification();
        let ok = true;
        Object.keys(fieldMap).forEach((k) => {
          if (!validateField(k).ok) ok = false;
        });
        return ok;
      };

      // Real-time UX
      Object.keys(fieldMap).forEach((k) => {
        const f = fieldMap[k];
        if (!f?.input) return;

        f.input.addEventListener('blur', () => safe(() => validateField(k)));
        f.input.addEventListener(
          'input',
          () => {
            if (f.input.classList.contains('form-is-invalid')) safe(() => validateField(k));
          },
          { passive: true }
        );
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const ok = validateAll();
        if (!ok) {
          const firstInvalid = form.querySelector('.form-is-invalid[aria-invalid="true"]') || form.querySelector('.form-is-invalid');
          firstInvalid?.focus();
          setNotification('Please fix the highlighted fields and try again.', true);
          return;
        }

        const wasDisabled = !!submitBtn?.disabled;
        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-busy', 'true');
          }

          await new Promise((r) => setTimeout(r, 700));
          setNotification('Message sent successfully. Thank you! We will get back to you soon.', false);

          form.reset();
          Object.values(fieldMap).forEach((f) => clearInvalid(f.input, f.err));
        } catch {
          setNotification('Something went wrong while sending your message. Please try again.', true);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = wasDisabled;
            submitBtn.removeAttribute('aria-busy');
          }
        }
      });
    }
  };

  // ------------------------------
  // Admissions FAQ + Wizard
  // ------------------------------
  const AdmissionsUI = {
    init() {
      // FAQ accordion
      const faq = $('.faq-accordion');
      if (faq) {
        const faqItems = $$('.faq-item', faq);
        faqItems.forEach((item) => {
          if (!item.dataset.open) item.dataset.open = 'false';

          const btn = $('.faq-question', item);
          const ans = $('.faq-answer', item);

          const setOpenItem = (open) => {
            item.dataset.open = open ? 'true' : 'false';
            btn?.setAttribute('aria-expanded', open ? 'true' : 'false');
            ans?.setAttribute('aria-hidden', open ? 'false' : 'true');
          };

          setOpenItem(item.dataset.open === 'true');
          btn?.addEventListener('click', () => setOpenItem(item.dataset.open !== 'true'));
        });
      }

      const form = $('#admissionForm');
      if (!form) return;

      const steps = $$('.wizard-step', form);
      if (!steps.length) return;

      const progressFill = $('#wizardProgressFill');
      const successBox = $('#wizardSuccess');

      let currentStep = Math.max(0, steps.findIndex((s) => !s.hasAttribute('hidden')));

      const getStepNumber = (stepEl) => Number(stepEl.dataset.step || '1');

      const setFieldError = (fieldEl, errEl, message) => {
        if (!fieldEl || !errEl) return;
        if (message) {
          fieldEl.setAttribute('aria-invalid', 'true');
          errEl.textContent = message;
        } else {
          fieldEl.removeAttribute('aria-invalid');
          errEl.textContent = '';
        }
      };

      const updateReview = () => {
        const active = steps[currentStep];
        if (!active || getStepNumber(active) !== 4) return;

        const labelMap = { form1: 'Form 1', form2: 'Form 2', form3: 'Form 3', form4: 'Form 4', form5: 'Form 5', form6: 'Form 6' };
        const cpLabel = (v) => {
          if (v === 'phone') return 'Phone call';
          if (v === 'whatsapp') return 'WhatsApp';
          if (v === 'email') return 'Email';
          return v || '—';
        };

        const setText = (id, value) => {
          const el = $('#' + id);
          if (el) el.textContent = value || '—';
        };

        setText('reviewLearnerName', ($('#learnerName')?.value || '').trim());
        setText('reviewDob', ($('#dateOfBirth')?.value || '').trim());

        const pref = $('#preferredClass')?.value;
        setText('reviewPreferredClass', labelMap[pref] || pref);

        setText('reviewParentName', ($('#parentName')?.value || '').trim());
        setText('reviewPhoneNumber', ($('#phoneNumber')?.value || '').trim());

        const cp = $('#contactPreference')?.value;
        setText('reviewContactPreference', cpLabel(cp));

        setText('reviewInterests', ($('#learnerInterests')?.value || '').trim());
      };

      const validateStep = (stepEl) => {
        const stepNum = getStepNumber(stepEl);
        let valid = true;

        // Clear errors in this step
        const requiredFields = $$('input[required], select[required], textarea[required]', stepEl);
        requiredFields.forEach((field) => {
          const errEl = $('#err-' + field.id);
          if (errEl) setFieldError(field, errEl, '');
        });

        if (stepNum === 1) {
          const learnerName = $('#learnerName');
          const preferredClass = $('#preferredClass');

          if (learnerName && !learnerName.value.trim()) {
            setFieldError(learnerName, $('#err-learnerName'), 'Please enter the learner’s full name.');
            valid = false;
          }
          if (preferredClass && !preferredClass.value) {
            setFieldError(preferredClass, $('#err-preferredClass'), 'Please select the preferred class.');
            valid = false;
          }
        }

        if (stepNum === 2) {
          const parentName = $('#parentName');
          const phoneNumber = $('#phoneNumber');

          if (parentName && !parentName.value.trim()) {
            setFieldError(parentName, $('#err-parentName'), 'Please enter the parent/guardian name.');
            valid = false;
          }
          if (phoneNumber && !phoneNumber.value.trim()) {
            setFieldError(phoneNumber, $('#err-phoneNumber'), 'Please enter a phone number.');
            valid = false;
          }
        }

        if (stepNum === 3) {
          const contactPreference = $('#contactPreference');
          const errEl = $('#err-contactPreference');
          if (contactPreference?.required && !contactPreference.value) {
            setFieldError(contactPreference, errEl, 'Please choose a preferred contact method.');
            valid = false;
          }
        }

        return valid;
      };

      const showStep = (idx, { focusFirst = true } = {}) => {
        currentStep = Math.max(0, Math.min(idx, steps.length - 1));

        steps.forEach((el, i) => {
          if (i === currentStep) el.removeAttribute('hidden');
          else el.setAttribute('hidden', '');
        });

        if (progressFill) {
          const pct = ((currentStep + 1) / steps.length) * 100;
          progressFill.style.width = `${pct}%`;
        }

        if (successBox) successBox.hidden = true;

        updateReview();

        if (focusFirst) {
          const active = steps[currentStep];
          active?.querySelector('input, select, textarea, button')?.focus();
        }
      };

      showStep(currentStep, { focusFirst: false });

      // Click handlers (delegation)
      form.addEventListener('click', (e) => {
        const nextBtn = e.target.closest('[data-next]');
        const backBtn = e.target.closest('[data-back]');
        if (!nextBtn && !backBtn) return;

        if (nextBtn) {
          const active = steps[currentStep];
          if (!validateStep(active)) {
            (active.querySelector('[aria-invalid="true"]') || active.querySelector('input[required],select[required]'))?.focus();
            return;
          }
          const nextIdx = currentStep + 1;
          if (nextIdx < steps.length) showStep(nextIdx);
          active.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }

        if (backBtn) {
          const prevIdx = currentStep - 1;
          if (prevIdx >= 0) showStep(prevIdx);
          steps[currentStep]?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        let ok = true;
        for (let i = 0; i < Math.min(3, steps.length); i++) {
          if (!validateStep(steps[i])) ok = false;
        }
        if (!ok) {
          showStep(0, { focusFirst: false });
          return;
        }

        // Ensure we are on review step if it exists
        const idx4 = steps.findIndex((s) => getStepNumber(s) === 4);
        if (idx4 >= 0) showStep(idx4, { focusFirst: false });

        if (successBox) {
          successBox.hidden = false;
          if (!prefersReducedMotion) successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setTimeout(() => {
          form.reset();
          if (successBox) successBox.hidden = true;
          showStep(0, { focusFirst: false });
        }, 2500);
      });

      // Live review update while on step 4
      const reviewFieldIds = ['learnerName', 'dateOfBirth', 'preferredClass', 'parentName', 'phoneNumber', 'contactPreference', 'learnerInterests'];
      reviewFieldIds.forEach((id) => {
        $('#' + id)?.addEventListener('input', updateReview);
        $('#' + id)?.addEventListener('change', updateReview);
      });
    }
  };

  // ------------------------------
  // Chatbot
  // ------------------------------
  const Chatbot = {
    init() {
      const btn = $('#chatbot-btn');
      const panel = $('#chatbot');
      const closeBtn = $('#close-chatbot');
      const input = $('#chat-input');
      const sendBtn = $('#send-chat');
      const messages = $('.chatbot-messages');

      if (!btn || !panel || !closeBtn || !input || !sendBtn || !messages) return;

      let isOpen = false;
      let isSending = false;

      const typingId = 'chatbot-typing-indicator';

      const ensureTyping = () => {
        let el = $('#' + typingId, panel);
        if (!el) {
          el = document.createElement('div');
          el.id = typingId;
          el.className = 'message bot';
          el.textContent = 'Typing…';
          el.hidden = true;
          el.setAttribute('aria-live', 'polite');
          messages.appendChild(el);
        }
        return el;
      };

      const setTyping = (show) => {
        const el = ensureTyping();
        el.hidden = !show;
        if (show) messages.scrollTop = messages.scrollHeight;
      };

      const addMessage = (text, isUser = false) => {
        const div = document.createElement('div');
        div.className = `message ${isUser ? 'user' : 'bot'}`;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
      };

      const routeResponse = (userText) => {
        const t = (userText || '').toLowerCase();
        const hasAny = (arr) => arr.some((k) => t.includes(k));

        if (hasAny(['admission', 'admissions', 'enroll', 'enrol', 'apply', 'application'])) {
          return 'Admissions are open. Visit the Admissions page or call +256 702 123 456.';
        }

        if (hasAny(['fee', 'fees', 'bursar', 'tuition', 'payment', 'payments'])) {
          return 'For fees and bursary support, contact Accounts / Fees: +256 772 222 333 or email accounts@rinesschool.ac.ug.';
        }

        if (hasAny(['location', 'where', 'campus', 'map', 'directions', 'magezi'])) {
          return 'We are in Magezi Ntake, Uganda. Use the “Visit Us” map section for directions.';
        }

        if (hasAny(['contact', 'email', 'phone', 'call', 'reach'])) {
          return 'You can reach us via the Contact form, or call +256 702 123 456. For admissions, select “Admissions” in the form.';
        }

        return 'I can help with admissions, fees, location/directions, and contact info. What do you need?';
      };

      const open = () => {
        if (isOpen) return;
        isOpen = true;
        panel.classList.add('active');
        setTimeout(() => input.focus(), 0);
      };

      const close = () => {
        if (!isOpen) return;
        isOpen = false;
        panel.classList.remove('active');
      };

      btn.addEventListener('click', open);
      closeBtn.addEventListener('click', close);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      }, { passive: true });

      document.addEventListener('click', (e) => {
        if (!isOpen) return;
        if (panel.contains(e.target) || btn.contains(e.target)) return;
        close();
      }, { passive: true });

      const send = async () => {
        if (isSending) return;

        const text = (input.value || '').trim();
        if (!text) return;

        isSending = true;
        addMessage(text, true);
        input.value = '';
        setTyping(true);

        try {
          await new Promise((r) => setTimeout(r, 650));
          const response = routeResponse(text);
          setTyping(false);
          addMessage(response, false);
        } catch {
          setTyping(false);
          addMessage('Sorry—something went wrong. Please try again.', false);
        } finally {
          isSending = false;
          input.focus();
        }
      };

      sendBtn.addEventListener('click', send);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          send();
        }
      });
    }
  };

  // ------------------------------
  // Gallery hover
  // ------------------------------
  const Gallery = {
    init() {
      const items = $$('.gallery-item');
      if (!items.length) return;

      const hasHover = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
      if (!hasHover) return;

      items.forEach((item) => {
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'scale(1.02)';
        });
        item.addEventListener('mouseleave', () => {
          item.style.transform = 'scale(1)';
        });
      });
    }
  };

  // Bootstrap
  safe(() => {
    Nav.initMobileMenu();
    Nav.initSmoothScrolling();
    Nav.initNavbarScrollEffect();

    Animations.initReveal();
    Animations.initTimelineActive();
    Animations.initCounters();

    Academics.init();
    BlogNews.init();
    ContactForm.init();
    AdmissionsUI.init();
    Chatbot.init();

    Gallery.init();
  });
})();

