import { cube } from './math'
import fuck from './data.json'
console.log(fuck)

function component () {
  const element = document.createElement('pre')

  element.innerHTML = [
    'Hello webpack!',
    '5 cubed is equal to ' + cube(5),
  ].join(' ')

  return element
}

document.body.appendChild(component())

if (process.env.NODE_ENV !== 'production') {
  console.log('Looks like we are in development mode!')
}
