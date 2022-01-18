<?php
	require('functions.php');
	session_start();
	$con = db();

	if (isset($_POST['username'])){
		$username = stripslashes($_REQUEST['username']); 
		$username = mysqli_real_escape_string($con,$username); 
		$password = stripslashes($_REQUEST['password']);
		$password = mysqli_real_escape_string($con,$password);
		
		// Da li postoji korisnik u bazi
		$query = "SELECT * FROM `users` WHERE username='$username' and password='".md5($password)."'";
		$result = mysqli_query($con,$query) or die(mysql_error());
		$rows = mysqli_num_rows($result);
		if($rows==1){
			$_SESSION['username'] = $username;
				header("Location: index.php"); 
			}
			else{
				$err = "Pogrešan username / password";				
			}
	}

print_header();
print_navigacija();

if(isset($err)) echo $err;
?>

<h1>Log In</h1>
<div class="form">
<form action="" method="post" name="login">
<input type="text" name="username" placeholder="Username" required />
<input type="password" name="password" placeholder="Password" required />
<input name="submit" type="submit" value="Login" />
</form>

</div>

</body>
</html>
