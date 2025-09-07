---
layout: page
title: Projects
permalink: /projects/
description: "Software projects and development work."
image: "/assets/images/profile.jpeg"
---

## Featured Projects

{% for project in site.data.projects %}
  {% if project.featured %}
<div style="border: 1px solid #e1e4e8; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
  <h3><a href="{{ project.url }}" target="_blank">{{ project.name }}</a></h3>
  <p>{{ project.description }}</p>
  {% if project.demo %}
    <p><strong>Demo:</strong> <a href="{{ project.demo }}" target="_blank">{{ project.demo }}</a></p>
  {% endif %}
  <p><strong>Technologies:</strong> 
    {% for tech in project.technologies %}
      <span style="background-color: #f1f8ff; color: #0366d6; padding: 2px 6px; border-radius: 3px; font-size: 0.85em; margin-right: 4px;">{{ tech }}</span>
    {% endfor %}
  </p>
</div>
  {% endif %}
{% endfor %}

## All Projects

{% for project in site.data.projects %}
  {% unless project.featured %}
<div style="border: 1px solid #e1e4e8; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
  <h3><a href="{{ project.url }}" target="_blank">{{ project.name }}</a></h3>
  <p>{{ project.description }}</p>
  {% if project.demo %}
    <p><strong>Demo:</strong> <a href="{{ project.demo }}" target="_blank">{{ project.demo }}</a></p>
  {% endif %}
  <p><strong>Technologies:</strong> 
    {% for tech in project.technologies %}
      <span style="background-color: #f1f8ff; color: #0366d6; padding: 2px 6px; border-radius: 3px; font-size: 0.85em; margin-right: 4px;">{{ tech }}</span>
    {% endfor %}
  </p>
</div>
  {% endunless %}
{% endfor %}

---

**Want to see more?** Visit my [GitHub profile](https://github.com/mjchaker) to explore all repositories and contributions.