###
# Page options, layouts, aliases and proxies
###

# Per-page layout changes:
#
# With no layout
page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

# With alternative layout
# page "/path/to/file.html", layout: :otherlayout

# Proxy pages (http://middlemanapp.com/basics/dynamic-pages/)
# proxy "/this-page-has-no-template.html", "/template-file.html", locals: {
#  which_fake_page: "Rendering a fake page with a local variable" }

# General configuration

# Pretty directory indexes.
activate :directory_indexes

ignore '*.swp'

activate :blog do |blog|
  blog.sources = "blog/{_}/{_}"
  blog.permalink = "{category}/{title}"
  blog.layout = false
end


set :layout, :layout

page "blog/*/*", layout: :blog
page "/cv"

# Reload the browser automatically whenever files change
configure :development do
  activate :livereload
end

###
# Helpers
###

require 'helpers/google_analytics_helper'
include GoogleAnalyticsHelper

# Build-specific configuration
configure :build do
  # Minify CSS on build
  # activate :minify_css

  # Minify Javascript on build
  # activate :minify_javascript
end

activate :deploy do |deploy|
  deploy.deploy_method = :git
  deploy.branch = 'master'
end

activate :external_pipeline,
  name: :webpack,
  command: build? ?
  "./node_modules/webpack/bin/webpack.js --bail -p" :
  "./node_modules/webpack/bin/webpack.js --watch -d --progress --color",
  source: ".tmp/dist",
  latency: 1

set :css_dir, 'assets/stylesheets'
set :js_dir, 'assets/javascripts'
set :images_dir, 'assets/images'
