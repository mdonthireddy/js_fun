// Typed From Cyclejs video tutorial
const main = (sources) => {
  const click$ = sources.DOM
  return {
    DOM: click$.startWith(null).map(() =>
      xs.periodic(1000)
        .fold(prev => prev + 1, 0)
      ).flatten()
      .map( i =>
        // Here we could return JSX if we want React
         `Seconds elapsed: ${i}`),
    log: xs.periodic(2000)
      .fold(prev => prev + 1, 0)
  }
}

function domDriver(text$) {
  text$subscribe({
    next: str => {
      const elem = document.querySelector('#app')
      elem.textContect = str;
    }
  })
  const domSource = fromEvent(document, 'click')
  return domSource;
}

funciton logDriver(msg$) {
  msg$.subscribe({
    next: msg => {
      console.log(msg)
    }
  })
}
function run (mainFn, drivers) {
  const fakeDOMSinks = {}
  Object.keys(fakeDOMSinks).forEach(driver => {
    fakeDOMSinks[driver] = xs.create();
  }
  const domSources = Object.keys(drivers).map(key =>
    drivers[key](sinks[key], fakeDOMSinks[key])
  )
  const sinks = mainFn(domSources)
  Object.keys(sinks).forEach(key => fakeDOMSinks[key].imitate(sinks[key]))

}

run(main, {
  DOM: domDriver,
  log: logDriver
})
