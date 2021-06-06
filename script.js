'use strict';
// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sidebarEvents = document.querySelector('.workouts');

// -- C O D E -- H E R E -- \\
class App {
  currentCoords;
  map;
  mapZoom = 13;
  workouts = [];
  allMarkers = [];

  constructor() {
    form.reset();
    this._getLocalStorage();
    this._getPosition();
    this._addEventHandler();
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        //LOCATION NOT ALLOWED
        alert(
          'Could not get your location. If you wish to proceed, allow us to get your location.'
        );
      }
    );
  }

  _addEventHandler() {
    this.btnModalMenu = document.querySelector('.workout__menu--button');

    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    sidebarEvents.addEventListener(
      'click',
      this._somethingSomethinge.bind(this)
    );

    document.addEventListener(
      'keydown',
      function (e) {
        if (e.key == 'Escape') this._hideForm();
      }.bind(this)
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    this.currentCoords = [latitude, longitude];

    this.map = L.map('map').setView(this.currentCoords, this.mapZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    //EVENTS AFTER MAP LOADS
    this.map.on('click', this._showForm.bind(this));

    //ADDING MARKER FROM LOCAL STORAGE
    this.workouts.forEach((work) => {
      this._addMarkerToMap(work);
    });

    if (this.workouts.length == 0)
      this._showForm({
        latlng: {
          lat: this.currentCoords[0],
          lng: this.currentCoords[1],
        },
      });
  }

  _showForm(mapE) {
    this.mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    //HELPER FUNCTIONS
    const validNumber = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const positiveNumber = (...inputs) => inputs.every((inp) => inp > 0);

    //Getting coordinates
    const { lat: latitude, lng: longitude } = this.mapEvent.latlng;

    //Get the info from input fields
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    let workout;

    //Check if the data is correct
    if (type == 'running') {
      const cadence = +inputCadence.value;

      if (
        !validNumber(distance, duration, cadence) ||
        !positiveNumber(distance, duration, cadence)
      )
        return alert('Bruh. Enter a number');

      workout = new Running([latitude, longitude], distance, duration, cadence);
    }

    if (type == 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validNumber(distance, duration, elevation) ||
        !positiveNumber(distance, duration)
      )
        return alert('Bruh. Enter a number');

      workout = new Cycling(
        [latitude, longitude],
        distance,
        duration,
        elevation
      );
    }

    //Displaying marker on Map
    this._addMarkerToMap(workout);
    this.workouts.push(workout); //Adding workout on the Map

    //render that workout on map
    this._renderWorkout(workout);

    //Hide form After completing stuff.
    this._hideForm();

    //Storing in local storage.
    this._setLocalStorage();
  }

  _hideForm() {
    inputCadence.value =
      inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.classList.add('hidden');
  }

  _addMarkerToMap(workout) {
    this.allMarkers[this.allMarkers.length] = L.marker(workout.coords)
      .addTo(this.map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }).setContent(`${workout.description}`)
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html2;

    if (workout.type == 'cycling') {
      html2 = `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevation}</span>
                <span class="workout__unit">m</span>
            </div>`;
    } else {
      html2 = `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
                </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>`;
    }

    const html = `
        <h2 class="workout__title">${workout.description}</h2>
        <button class="workout__menu--button">...</button>
                <ul class="workout__menu hidden">
                    <li class="delete__workout">Delete Workout</li>
                </ul>
        <div class="workout__details">
            <span class="workout__icon">${
              workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'
            } </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
        </div>`;

    const htmlDisplay = `<li class="workout workout--${workout.type}" data-id=${
      workout.ID
    }>${html + html2}</li>`;

    form.insertAdjacentHTML('afterend', htmlDisplay);
  }

  _somethingSomethinge(e) {
    const workoutClosest = e.target.closest('.workout');
    const workoutTarget = e.target;

    if (workoutClosest == form || !workoutClosest) return;

    if (workoutTarget.classList.contains('workout__menu--button')) {
      workoutTarget.nextElementSibling.classList.toggle('hidden');
      return;
    }

    if (workoutTarget.classList.contains('delete__workout')) {
      this._deleteWorkout(workoutClosest);
      return;
    }

    if (workoutTarget.classList.contains('edit__workout')) {
      this._editWorkout(workoutClosest);
      return;
    }

    this._moveToWorkout(workoutClosest);
  }

  _moveToWorkout(workoutClosest) {
    const work = this.workouts.find(
      (wrk) => workoutClosest.dataset.id == wrk.ID
    );
    this.map.setView(work.coords, this.mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  //Editing Workout --
  _editWorkout(workoutEl) {
    // console.log(workoutEl)
    const editIndex = this._findIndex(workoutEl.dataset.id);

    this._deleteWorkout(workoutEl);

    const workoutObj = this.workouts[editIndex];
    console.log(workoutObj);
    inputDistance.value = workoutObj.distance;
    inputDuration.value = workoutObj.duration;
    inputType.value = workoutObj.inputType;
    this._showForm({
      latlng: {
        lat: workoutObj.coords[0],
        lng: workoutObj.coords[1],
      },
    });
    //Check if the data is correct
    // if(type == 'running') {
    //     const cadence = +inputCadence.value;

    //     if(!validNumber(distance, duration, cadence) || !positiveNumber(distance, duration, cadence))
    //     return alert('Bruh. Enter a number');

    //     workout = new Running([latitude, longitude], distance, duration, cadence)
    // }

    // if(type == 'cycling') {
    //     const elevation = +inputElevation.value;

    //     if(!validNumber(distance, duration, elevation) || !positiveNumber(distance, duration))
    //     return alert('Bruh. Enter a number');

    //     workout = new Cycling([latitude, longitude], distance, duration, elevation);
    // }
  }

  _findIndex(id) {
    let i = 0;
    for (const work of this.workouts) {
      if (work.ID == id) {
        break;
      }
      i++;
    }
    return i;
  }

  _deleteWorkout(workoutEl) {
    const deleteIndex = this._findIndex(workoutEl.dataset.id);

    //Finding and Deleting marker --
    let deleteMarker;
    for (const marker of this.allMarkers) {
      const { lat: latitude, lng: longitude } = marker._latlng;
      const coords = [latitude, longitude];

      if (this.workouts[deleteIndex].coords[0] == coords[0]) {
        deleteMarker = marker;
        break;
      }
    }
    this.map.removeLayer(deleteMarker);

    this.workouts.splice(deleteIndex, 1);
    // DELETE ANIMATION
    workoutEl.classList.add('deleted');

    setTimeout(function () {
      workoutEl.remove();
    }, 1000);

    //Storing in local storage.
    this._setLocalStorage();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.workouts = data;

    this.workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

//WORKOUT CLASSES
class Workout {
  date = new Date();
  ID = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescription() {
    this.description = `${this.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
      this.type[0].toUpperCase() + this.type.slice(1)
    } on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this._setDescription();
    this._calcSpeed();
  }

  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._setDescription();
    this._calcPace();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

let app;
function init() {
  app = new App();
}
init();
