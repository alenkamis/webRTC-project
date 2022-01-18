#FROM mysql/mysql-server:5.7
FROM mysql/mysql-server:latest

ENV MYSQL_ALLOW_EMPTY_PASSWORD=true
ENV MYSQL_USER=web
ENV MYSQL_PASSWORD=example
ENV MYSQL_DATABASE=web

COPY ./sql/ /docker-entrypoint-initdb.d/
COPY ./my.cnf /etc/my.cnf
