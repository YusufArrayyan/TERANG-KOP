/* TERANG-KOP — penghubung rute #/ ke halaman depan React (landing/, dibangun ke src/landing/). */
(function () {
  'use strict';
  var App = window.App;
  App.views.depan = {
    render: function () { return '<div id="lp-root"></div>'; },
    after: function () {
      var el = document.getElementById('lp-root');
      if (el && window.TerangLanding) window.TerangLanding.mount(el);
    }
  };
  // Saat pindah ke rute aplikasi, lepaskan pohon React agar animasi dan WebGL berhenti.
  window.addEventListener('hashchange', function () {
    if (window.TerangLanding && !document.getElementById('lp-root')) window.TerangLanding.unmount();
  });
})();
