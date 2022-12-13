import { describe } from 'https://jslib.k6.io/functional/0.0.3/index.js';
import { Httpx, Request, Get, Post } from 'https://jslib.k6.io/httpx/0.0.2/index.js';
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.1.0/index.js";

export const options = {
  stages: [
    // Dibawah beban kerja yang normal
    { duration: '2m', target: 200 }, 
    { duration: '5m', target: 200 },
    // Beban kerja yang normal
    { duration: '2m', target: 300 }, 
    { duration: '5m', target: 300 },
    // Disekitaran ambang batas    
    { duration: '2m', target: 400 }, 
    { duration: '5m', target: 400 },
    // Diatas dari ambang batas
    { duration: '2m', target: 500 }, 
    { duration: '5m', target: 500 },
    // Ramp-down VU dari 500 VU hingga 0 VU
    { duration: '10m', target: 0 }, 
  ],
};  

// Inisialisasi Username berupa Email dan Password
const USERNAME = `user${randomIntBetween(1, 100000)}@example.com`;
const PASSWORD = 'superCroc2019';
// Inisialisasi session yang akan dibuat
let session = new Httpx({baseURL: 'https://test-api.k6.io'});

// Main Function
export default function testSuite() {
  // Mengambil Item melalui public endpoint
  describe('01. Fetch public crocs', (t) => {
    let responses = session.batch([
      new Get('/public/crocodiles/1/'),
      new Get('/public/crocodiles/2/'),
      new Get('/public/crocodiles/3/'),
      new Get('/public/crocodiles/4/'),
    ], {
      tags: {name: 'PublicCrocs'},
    });
    // Mengecek apakah setiap respon yang diberikan website
    // memiliki status = 200 dan sebuah json, yang dimana age yang ada di dalam file json 
    // memiliki nilai lebih dari 7
    responses.forEach(response => {
      t.expect(response.status).as("response status").toEqual(200)
        .and(response).toHaveValidJson()
        .and(response.json('age')).as('croc age').toBeGreaterThan(7);
    });
  })

  // Membuat sebuah user dengan Email yang telah ditentukan secara random di atas
  describe(`02. Create a test user ${USERNAME}`, (t) => {
    // Melakukan registrasi
    let resp = session.post(`/user/register/`, {
      first_name: 'Crocodile',
      last_name: 'Owner',
      username: USERNAME,
      password: PASSWORD,
    });
    // Mengecek respons yang didapat apakah memiliki status = 201
    // serta memiliki sebuah file json
    t.expect(resp.status).as("status").toEqual(201)
      .and(resp).toHaveValidJson();
  })

  // Melakukan login user
  describe(`03. Authenticate the new user ${USERNAME}`, (t) => {
    // Login user dengan username dan password yang telah diregistrasi
    let resp = session.post(`/auth/token/login/`, {
      username: USERNAME,
      password: PASSWORD
    });

    // Mengecek respons apakah status otorisasi yang didapat merupakan nilai antara 200-204
    // dan apakah memiliki sebuah file json yang berisikan access bersifat true
    t.expect(resp.status).as("Auth status").toBeBetween(200, 204)
      .and(resp).toHaveValidJson()
      .and(resp.json('access')).as("auth token").toBeTruthy();

    let authToken = resp.json('access');
    // Mengkonfigurasi header otorisasi di session untuk request berikutnya
    session.addHeader('Authorization', `Bearer ${authToken}`);

  })

  // Membuat item crocodile baru
  describe('04. Create a new crocodile', (t) => {
    // Inisialisasi item baru yang akan dimasukkan
    let payload = {
      name: `Croc Name`,
      sex: randomItem(["M", "F"]),
      date_of_birth: '2019-01-01',
    };

    // Membuat item sesuai dengan inisialisasi di atas
    let resp = session.post(`/my/crocodiles/`, payload);
    // Mengecek status respon yaitu sama dengan 201 dan apakah
    // respons yang didapat memiliki file json
    t.expect(resp.status).as("Croc creation status").toEqual(201)
      .and(resp).toHaveValidJson();

    session.newCrocId=resp.json('id');
  })

  // Mengambil seluruh item, yaitu crocodiles, yang dimiliki oleh user
  // melalui private endpoint 
  describe('05. Fetch private crocs', (t) => {

    let response = session.get('/my/crocodiles/');
      
    t.expect(response.status).as("response status").toEqual(200)
      .and(response).toHaveValidJson()
      .and(response.json().length).as("number of crocs").toEqual(1);
  })

  // Melakukan perbaruan terhadapat item, yaitu crocodiles
  describe('06. Update the croc', (t) => {
    // Inisialisasi nama baru 
    let payload = {
      name: `New name`,
    };

    // Melakukan perbaruan sesuai dengan inisialisasi di atas
    let resp = session.patch(`/my/crocodiles/${session.newCrocId}/`, payload);

    // Mengecek apakah status yang diterima sama dengan 200
    // serta memiliki file json dengan berisi name = [nama baru]
    t.expect(resp.status).as("Croc patch status").toEqual(200)
      .and(resp).toHaveValidJson()
      .and(resp.json('name')).as('name').toEqual('New name');

    let resp1 = session.get(`/my/crocodiles/${session.newCrocId}/`);
  })

  // Menghapus item, yaitu crocodiles
  describe('07. Delete the croc', (t) => {
    // Melakukan penghapusan
    let resp = session.delete(`/my/crocodiles/${session.newCrocId}/`);
    // Mengecek apakah status dari respons yang didapat adalah sama dengan 204
    t.expect(resp.status).as("Croc delete status").toEqual(204);
  });

}