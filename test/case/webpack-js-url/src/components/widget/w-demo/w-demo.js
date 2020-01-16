const wDemo = {
  init() {
    const logoEl = document.getElementById('logo');
    let i;
    const iClass = [0, 1, 2, 3];

    setInterval(() => {
      const here = iClass.concat([]);
      here.splice(here.indexOf(i), 1);

      i = here[Math.round(Math.random() * (here.length - 1))];
      logoEl.className = `w-demo-logo w-demo-logo-${i}`;
    }, 2000);
  }
};


module.exports = wDemo;
