FROM node:12
RUN apt update && apt install -y libvips-dev
RUN SHARP_DIST_BASE_URL=https://s3.amazonaws.com/MYS3NAME/ npm install --unsafe-perm -g @omneedia/cli
EXPOSE 8000
