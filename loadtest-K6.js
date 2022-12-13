// Load Test

// import library
import http from 'k6/http';
import { check, sleep } from 'k6';

// in it file
export const options = {

  // konfigurasi stages
  stages: [
    // simulasi traffic user dari 1-100 dari 5 menit pertama
    { duration: '5m', target: 100 }, 
    // 10 menit selanjutnya, traffic akan tetap berada di 100 user
    { duration: '10m', target: 100 }, 
    // 5 menit selanjutnya akan dilakukan ramp-down traffic dari 100-0
    { duration: '5m', target: 0 }, 
  ],

  // konfigurasi threshold
  thresholds: {
    // durasi dari 99% http request, harus dibawah 1.5s
    'http_req_duration': ['p(99)<1500'], 
  },
};

// konfigurasi base_url dari website yang akan diuji
const BASE_URL = 'https://test-api.k6.io';

// konfigurasi username dan password untuk melakukan pengujian login
const USERNAME = 'TestUser';
const PASSWORD = 'SuperCroc2020';

// main function
export default () => {
  // login user
  const loginRes = http.post(`${BASE_URL}/auth/token/login/`, {
    username: USERNAME,
    password: PASSWORD,
  });

  // check log in
  check(loginRes, {
    'log in berhasil': (resp) => resp.json('access') !== '',
  });

  // mendefinisikan token bearer
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${loginRes.json('access')}`,
    },
  };

  // mengambil list item
  const myObjects = http.get(`${BASE_URL}/my/crocodiles/`, authHeaders).json();

  // check list item
  check(myObjects, { 'retrieved crocodiles': (obj) => obj.length > 0 });

  // sleep
  sleep(1);
};
