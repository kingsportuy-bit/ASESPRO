FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html contacto.html nosotros.html servicios.html cobertura.html robots.txt sitemap.xml /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY app.js components.css components.js experience.css experience.js nosotros-servicios-ajustes.css styles.css /usr/share/nginx/html/

EXPOSE 80
