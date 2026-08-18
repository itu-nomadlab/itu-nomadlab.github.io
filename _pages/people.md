---
layout: page
title: People
permalink: /people/
description: The researchers, students, and collaborators behind NomadLab.
nav: true
nav_order: 2
---

<div class="page-intro nomad-panel">
  <p class="micro-label">The lab</p>
  <p class="page-intro__lead">NomadLab brings together researchers interested in intelligent systems that can adapt, reason, and communicate uncertainty.</p>
</div>

{% for group in site.data.people.groups %}
  {% if group.members and group.members.size > 0 %}
    <section class="people-section">
      <div class="section-heading section-heading--compact">
        <div>
          <p class="micro-label">{{ group.id }}</p>
          <h2>{{ group.title }}</h2>
          {% if group.description %}<p>{{ group.description }}</p>{% endif %}
        </div>
      </div>
      {% include people-grid.liquid members=group.members %}
    </section>
  {% endif %}
{% endfor %}

{% if site.data.people.recruiting.enabled %}
<section class="open-roster nomad-panel">
  <div>
    <p class="micro-label">Open route</p>
    <h2>{{ site.data.people.recruiting.title }}</h2>
    <p>{{ site.data.people.recruiting.text }}</p>
  </div>
  <a class="lab-button lab-button--secondary" href="{{ site.data.people.recruiting.button_url | relative_url }}">{{ site.data.people.recruiting.button_label }}</a>
</section>
{% endif %}
