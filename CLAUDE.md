# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal website for Mohamad Jad Chaker built with Jekyll and hosted on GitHub Pages. The site uses the Minima theme and includes personal information, education background, hobbies, and technical skills.

## Architecture

- **Jekyll Static Site**: Uses Jekyll with the `jekyll/minima` remote theme
- **GitHub Pages Hosting**: Deployed automatically to `https://mjchaker.github.io`
- **Content Structure**:
  - `index.md`: Main page content with personal information
  - `_config.yml`: Jekyll configuration with site metadata and social links
  - `_includes/custom-head.html`: Custom favicon and manifest links
  - `assets/`: Images and resume PDF
  - `favicon/`: Favicon files in multiple formats

## Development Commands

Since this is a Jekyll site hosted on GitHub Pages, local development requires Jekyll:

```bash
# Install Jekyll and dependencies (if not already installed)
gem install bundler jekyll

# Create Gemfile if it doesn't exist
bundle init
bundle add jekyll minima jekyll-feed jekyll-seo-tag jekyll-sitemap

# Serve locally
bundle exec jekyll serve

# Build for production
bundle exec jekyll build
```

## Key Configuration Files

- `_config.yml`: Main Jekyll configuration
  - Site metadata (title, description, URL)
  - Social media links configuration
  - Google Analytics tracking
  - Plugins: jekyll-feed, jekyll-seo-tag, jekyll-sitemap

## Content Management

- Main content is in `index.md` using Markdown
- Profile image: `assets/img/profile.jpeg`
- Resume: `assets/resume_public.pdf`
- Social links are configured in `_config.yml` under `minima.social_links`

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch. No manual build or deployment steps are required.