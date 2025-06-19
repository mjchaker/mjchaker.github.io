# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal website for Mohamad Jad Chaker built with Jekyll and hosted on GitHub Pages. The site uses the Minima theme and includes personal information, education background, hobbies, technical skills, and a blog for physics articles.

## Architecture

- **Jekyll Static Site**: Uses Jekyll with the `jekyll/minima` remote theme
- **GitHub Pages Hosting**: Deployed automatically to `https://mjchaker.github.io`
- **Blog System**: Full blog functionality with LaTeX/MathJax support for physics articles
- **Content Structure**:
  - `index.md`: Main landing page with personal information
  - `_config.yml`: Jekyll configuration with site metadata, social links, and blog settings
  - `_includes/custom-head.html`: Custom favicon links and MathJax configuration
  - `_posts/`: Blog articles in Markdown format with LaTeX support
  - `blog.md`: Blog listing page that displays all articles
  - `_data/projects.yml`: Data-driven projects page content
  - `assets/`: Images and resume PDF
  - `favicon/`: Multiple favicon formats for different devices

## Development Commands

Since this is a Jekyll site hosted on GitHub Pages, local development requires Jekyll:

```bash
# Install Jekyll and dependencies (if not already installed)
gem install bundler jekyll

# Create Gemfile if it doesn't exist
bundle init
bundle add jekyll minima jekyll-feed jekyll-seo-tag jekyll-sitemap

# Serve locally with auto-reload
bundle exec jekyll serve

# Build for production
bundle exec jekyll build
```

## Blog System Architecture

- **Posts Directory**: `_posts/` contains blog articles with naming format `YYYY-MM-DD-title.md`
- **LaTeX Support**: MathJax 3.0 configured in `_includes/custom-head.html` for mathematical equations
- **RSS Feed**: Automatically generated at `/feed.xml` via `jekyll-feed` plugin
- **URL Structure**: Blog posts follow `/blog/YYYY/MM/DD/title/` permalink format
- **Front Matter Requirements**: Each post needs layout, title, date, categories, tags, author, and excerpt

## Mathematical Content

- **Inline math**: Use `$equation$` syntax
- **Display math**: Use `$$equation$$` syntax  
- **LaTeX packages**: AMS math packages enabled for advanced mathematical notation
- **Rendering**: MathJax 3.0 with SVG output for optimal performance

## Social Media Integration

- **Platform Coverage**: Extensive social media links including mainstream and technical platforms
- **Icon System**: Uses Font Awesome brand icons via Jekyll Minima theme
- **Configuration**: All social links configured in `_config.yml` under `minima.social_links`
- **Icon Compatibility**: Must use Font Awesome brand icons (e.g., `signal-messenger`, `rocketchat` for Matrix)

## Key Configuration Files

- `_config.yml`: Main Jekyll configuration
  - Site metadata and social links
  - Blog permalink structure and pagination
  - Kramdown with MathJax integration
  - Google Analytics tracking
  - Navigation header pages order

## Content Management

- **Static Pages**: about.md, projects.md, skills.md, faq-page.md, blog.md
- **Dynamic Content**: Projects loaded from `_data/projects.yml`
- **Blog Articles**: Created in `_posts/` with proper Jekyll front matter
- **Assets**: Profile images in `assets/img/`, resume at `assets/resume_public.pdf`

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch. No manual build or deployment steps are required. RSS feed updates automatically when new blog posts are published.