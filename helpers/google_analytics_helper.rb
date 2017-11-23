module GoogleAnalyticsHelper
  def google_analytics_tracking
    <<~EOS
      <!-- Global site tag (gtag.js) - Google Analytics -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=UA-5992603-1"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'UA-5992603-1');
      </script>
    EOS
  end
end
