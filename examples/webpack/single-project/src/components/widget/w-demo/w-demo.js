import axios from 'axios';

const wDemo = {
  init() {
    const logoEl = document.getElementById('logo');
    const tEl = document.getElementById('t');
    let i;
    const iClass = [0, 1, 2, 3];

    axios.get('/api/mock/list/1').then((res) => {
      tEl.innerHTML = res.data.title;
    }).catch((er) => {
      throw new Error(er);
    });

    setInterval(() => {
      const here = iClass.concat([]);
      here.splice(here.indexOf(i), 1);

      i = here[Math.round(Math.random() * (here.length - 1))];
      logoEl.className = `w-demo-logo w-demo-logo-${i}`;
    }, 2000);
  }
};


module.exports = wDemo;
