---
layout: page
title: Blog
permalink: /blog/
---

# Physics & Science Articles

Welcome to my blog where I share insights, explanations, and thoughts about physics, science, and technology.

<div class="posts">
  {% for post in site.posts %}
    <article class="post">
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <p class="post-meta">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %d, %Y" }}</time>
        {% if post.categories.size > 0 %}
          • Categories: {{ post.categories | join: ", " }}
        {% endif %}
      </p>
      <div class="post-excerpt">
        {{ post.excerpt }}
      </div>
      <a href="{{ post.url | relative_url }}" class="read-more">Read more →</a>
    </article>
  {% endfor %}
</div>

{% if site.posts.size == 0 %}
<p>No articles published yet. Check back soon!</p>
{% endif %}