---
layout: page
title: Join Us
permalink: /join/
description: Opportunities for students, researchers, and collaborators to work with NomadLab.
nav: true
nav_order: 6
---

<div class="join-hero nomad-panel">
  <p class="micro-label">Join the route</p>
  <h2>We look for curiosity, rigor, and ownership.</h2>
  <p class="page-intro__lead">NomadLab welcomes thesis students, research interns, graduate researchers, and collaborators working near our research themes.</p>
</div>

<div class="opportunity-grid">
  <section class="opportunity-card nomad-panel">
    <span>01</span>
    <h3>Undergraduate projects</h3>
    <p>Strong projects usually begin with a concrete research question, a reproducible baseline, and enough time for careful evaluation.</p>
  </section>
  <section class="opportunity-card nomad-panel">
    <span>02</span>
    <h3>Graduate research</h3>
    <p>Prospective MSc and PhD researchers should describe the problem they want to study and how it connects to one of our research routes.</p>
  </section>
  <section class="opportunity-card nomad-panel">
    <span>03</span>
    <h3>Collaboration</h3>
    <p>We are interested in collaborations that pair a meaningful decision or scientific challenge with rigorous machine-learning methodology.</p>
  </section>
</div>

<section class="application-guide nomad-panel">
  <div>
    <p class="micro-label">A useful first message</p>
    <h2>Make the research fit visible.</h2>
  </div>
  <ol>
    <li><strong>Introduce yourself.</strong> Include your program, current stage, and relevant background.</li>
    <li><strong>Name the route.</strong> Point to the NomadLab theme or project that is closest to your interests.</li>
    <li><strong>Show evidence.</strong> Link a paper, repository, project, or concise technical note that represents your work.</li>
    <li><strong>Propose a next step.</strong> State whether you are seeking a thesis, internship, collaboration, or graduate position.</li>
  </ol>
  <div class="contact-route">
    <i class="ti ti-mail"></i>
    {% if site.contact_email %}
      <div><strong>Start a conversation</strong><p><a href="mailto:{{ site.contact_email }}">{{ site.contact_email }}</a></p></div>
    {% else %}
      <div><strong>Contact route</strong><p>Direct contact details will be published with the official lab launch.</p></div>
    {% endif %}
  </div>
</section>
