const {
    getBuilds,
    postRequestStart,
    postRequestFinish,
  } = require('./requests');
  
function builder() {
  getBuilds(10, 0)
    .then((builds) => {
      if (builds.data.data.length === 0) console.log('empty builds');
      for (let i = builds.data.data.length - 1; i >= 0; i -= 1) {
        const build = builds.data.data[i];
        switch (build.status) {
          case 'Waiting':
            postRequestStart(builds.data.data[i])
              .then(() => console.log(`${build.id} is successfully started !`))
              .catch(() => console.error('build start error'));
            break;
          case 'InProgress':
            const duration = Math.round(Math.random() * 50000); // eslint-disable-line
            setTimeout(() => {
              postRequestFinish(builds.data.data[i], duration)
                .then(() => console.log(`${build.id} is successfully finished !`))
                .catch(() => console.error('build finish error'));
            }, duration);
            break;
          default:
            break;
        }
      }
    })
    .catch(() => console.error('list error'))
    .finally(() => setTimeout(builder, 60 * 1000)); // process.env.period
}

builder();
console.log('builder is running');