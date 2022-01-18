<?php
    require('functions.php');
    auth();
    print_header();
    print_navigacija();

?>

<h1>Web RTC Call 2: <?php $soba; ?></h1>

<div>

Online korisnici:
<div id="korisnici">
</div>

<div id="videos">
    <div id="remote"><video id="remoteVideo" autoplay playsinline></video></div>
    <div id="local"><video id="localVideo" autoplay muted playsinline></video></div>   
</div>

<div style="clear:left;">
  <button onclick="prekid()">Prekini poziv</button>   

</div>

  <script>
    var username = '<?php echo $_SESSION["username"]; ?>';
    var hostname = '<?php echo $_SERVER['SERVER_NAME'] ?>';
    var room = '';

  </script>

<script src="/socket.io.js"></script>
<script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
<script src="script.js"></script>

</body>
</html>
