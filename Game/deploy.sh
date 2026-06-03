#!/bin/bash
npm run build
rsync -avz --delete dist/ root@shanca.me:/var/www/star-trail/
echo "部署完成：http://star.shanca.me"