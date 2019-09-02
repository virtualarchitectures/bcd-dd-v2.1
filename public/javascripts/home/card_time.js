let render = function(template, node) {
	//alert(template);
  if (!node) return;
  node.innerHTML = (typeof template === 'function' ? template() : template);
  var event = new CustomEvent('elementRenders', {
    bubbles: true
  });
  node.dispatchEvent(event);
  return node;
};

var tickClock = function() {
  let dNew = new Date();

  // console.log("New date: " + dNew);
  let options = {
    timeZone: 'Europe/Dublin',
    timeZoneName: 'short',
    hour12: false,
    weekday: 'short',
    month: 'short',
    day: 'numeric'

  };
  let d = dNew.toLocaleTimeString('en-GB', options).split('G')[0];
  let day = d.split(',')[0];
  let date = d.split(',')[1];
  let time = d.split(',')[2].split(' ')[1];
  // let meridian = d.split(',')[2].split(' ')[1];

  // console.log("Local time: " + d);
  render(`${time}<br>`, document.getElementById('clock-time'));
  render(`${day}<br>${date}`, document.getElementById('clock-day'));

};

tickClock();
window.setInterval(tickClock, 1000);