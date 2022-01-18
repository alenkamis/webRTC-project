<?php

function db(){
    $con = mysqli_connect($_ENV["MYSQL_SERVER"],$_ENV["MYSQL_USER"],$_ENV["MYSQL_PASSWORD"],$_ENV["MYSQL_DATABASE"]);

    if (mysqli_connect_errno())
    {
      echo "Failed to connect to MySQL: " . mysqli_connect_error();
    }
    return $con;
}

function auth(){
    session_start();
    if(!isset($_SESSION["username"]))
    {
        header("Location: login.php");
        exit(); 
    }
}

function print_header(){ ?>
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <title>Registration</title>
    <link rel="stylesheet" href="style.css" />
    </head>
    <body>
 <?
}


function print_navigacija(){
    echo '<div class="nav">';
    echo '<a href="index.php">Home</a> ';
    echo '<a href="call.php">WebRTC Call</a> ';

    if(!isset($_SESSION["username"])){
        echo '
        <a href="login.php">Login</a>
        <a href="registration.php">Registracija</a> ';
    }
    else{
        $username = $_SESSION["username"];
        echo "<a href='logout.php'>Logout ($username)</a> ";
    }  
    echo "</div>";

}