import './game'
import fuck from './data.json'
console.log(fuck)

if (process.env.NODE_ENV !== 'production') {
  console.log('Looks like we are in development mode!')
}
