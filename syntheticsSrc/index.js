/* eslint-disable no-console */
const assert = require('assert');
const axios = require('axios');

const url = process.env.SITE_ANALYTICS_URL;
const crowAuthUrl = process.env.CROW_AUTH_URL;
const applicationId = process.env.CROW_APP_ID;
const applicationSecret = process.env.CROW_APP_SECRET;
const sitesEndpoint = 'v1/sites';
const statsEndpoint = '/stats';
const testEmail = 'test@test.com';
const testUrl = 'test.com';
const [today] = new Date().toISOString().split('T');
const sleepTime = 5;

function sleep(sec) {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });
}

async function handler() {
  try {
    // ************************************************************************
    console.log('Retrieving application JWT');
    const getApplicationJwt = await axios({
      method: 'post',
      url: `${crowAuthUrl}/v1/application/signin`,
      data: {
        applicationId,
        applicationSecret,
      },
    });
    assert.ok(
      getApplicationJwt.status === 200,
      'Wrong status while getting application JWT',
    );
    const {
      data: {
        token: applicationToken,
      },
    } = getApplicationJwt;
    assert.ok(
      applicationToken,
      'Could not get application JWT',
    );
    console.log('PASSED');

    // ************************************************************************
    console.log('Retrieving user JWT');
    const getUserJwt = await axios({
      method: 'post',
      url: `${crowAuthUrl}/v1/signin`,
      headers: {
        authorization: `Bearer ${applicationToken}`,
      },
      data: {
        email: testEmail,
        password: 'test',
      },
    });
    assert.ok(
      getUserJwt.status === 200,
      'Wrong status while getting user JWT',
    );
    const {
      data: {
        token: userToken,
      },
    } = getUserJwt;
    assert.ok(
      userToken,
      'Could not get user JWT',
    );
    console.log('PASSED');

    // ************************************************************************
    console.log('Create site');
    const createSite = await axios({
      method: 'post',
      url: `${url}${sitesEndpoint}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      data: {
        url: testUrl,
      },
    });
    assert.ok(
      createSite.status === 201,
      `POST /sites status code not correct ${createSite.status}`,
    );
    const {
      data: {
        id: siteId,
      },
    } = createSite;
    assert.ok(
      siteId,
      'Create site did not return ID',
    );
    console.log('PASSED');

    // ************************************************************************
    console.log('Make sure GET sites includes new site');
    const getSites = await axios({
      method: 'get',
      url: `${url}${sitesEndpoint}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    assert.ok(
      getSites.status === 200,
      `GET /sites status code not correct ${getSites.status}`,
    );
    assert.ok(
      getSites.data.owner,
      'GET /sites response does not include owner list',
    );
    assert.ok(
      getSites.data.owner.includes(siteId),
      `Site ID ${siteId} not in owner list`,
    );
    assert.ok(
      getSites.data.admin,
      'GET /sites response does not include admin list',
    );
    assert.ok(
      getSites.data.writer,
      'GET /sites response does not include writer list',
    );
    assert.ok(
      getSites.data.reader,
      'GET /sites response does not include reader list',
    );
    console.log('PASSED');

    // ************************************************************************
    console.log('Retrieve site by ID');
    const getSiteById = await axios({
      method: 'get',
      url: `${url}${sitesEndpoint}/${siteId}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    assert.ok(
      getSiteById.status === 200,
      `GET /sites/{siteId} status code not correct ${getSiteById.status}`,
    );
    assert.ok(
      getSiteById.data.created,
      'GET /sites/{siteId} response does not include created time',
    );
    assert.ok(
      getSiteById.data.owner === testEmail,
      `GET /sites/{siteId} response does not include correct owner ${getSiteById.data.owner}`,
    );
    assert.ok(
      getSiteById.data.id === siteId,
      `GET /sites/{siteId} response does not include correct site ID ${getSiteById.data.id}`,
    );
    assert.ok(
      getSiteById.data.url === testUrl,
      `GET /sites/{siteId} response does not include correct URL ${getSiteById.data.url}`,
    );
    assert.ok(
      getSiteById.data.name === testUrl,
      `GET /sites/{siteId} response does not include correct default name ${getSiteById.data.name}`,
    );
    assert.ok(
      getSiteById.data.admins,
      'GET /sites/{siteId} response does not include admins',
    );
    assert.ok(
      getSiteById.data.writers,
      'GET /sites/{siteId} response does not include writers',
    );
    assert.ok(
      getSiteById.data.readers,
      'GET /sites/{siteId} response does not include readers',
    );
    console.log('PASSED');

    // ************************************************************************
    console.log('Add to stats');
    const addStats = await axios({
      method: 'post',
      url: `${url}${sitesEndpoint}/${siteId}${statsEndpoint}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      data: {
        pageView: '/frompigeon',
      },
    });
    assert.ok(
      addStats.status === 202,
      `POST /stats status code not correct ${addStats.status}`,
    );
    console.log('PASSED');

    // ************************************************************************
    console.log('Read stats');

    console.log(`Sleep ${sleepTime} seconds to give the API time to count the stat`);
    await sleep(sleepTime);

    const readStats = await axios({
      method: 'get',
      url: `${url}${sitesEndpoint}/${siteId}${statsEndpoint}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    assert.ok(
      readStats.status === 200,
      `GET /stats status code not correct ${readStats.status}`,
    );
    assert.ok(
      readStats.data[today],
      'GET /stats response does not include today in the data',
    );
    assert.ok(
      readStats.data[today].pageView,
      'GET /stats response does not include pageView in today\'s stats',
    );
    assert.ok(
      readStats.data[today].pageView['/frompigeon'] >= 1,
      'GET /stats response does not include correct page view in pageView in today\'s stats',
    );
    console.log('Read stats payload:');
    console.log(readStats.data);
    console.log('PASSED');

    // ************************************************************************
    console.log('Delete site');
    const deleteSite = await axios({
      method: 'delete',
      url: `${url}${sitesEndpoint}/${siteId}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    assert.ok(
      deleteSite.status === 204,
      `DELETE /sites status code not correct ${deleteSite.status}`,
    );
    console.log('PASSED');

    // ************************************************************************
    console.log('Make sure GET sites does not include deleted site');
    const getSitesDeletedSite = await axios({
      method: 'get',
      url: `${url}${sitesEndpoint}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    assert.ok(
      getSitesDeletedSite.status === 200,
      `GET /sites status code not correct ${getSitesDeletedSite.status}`,
    );
    assert.ok(
      !getSitesDeletedSite.data.owner.includes(siteId),
      `Site ID ${siteId} is in owner list and should not be`,
    );
    console.log('PASSED');

    // ************************************************************************
    console.log('Retrieve site by ID for missing site');
    const getSiteByIdDeletedSite = await axios({
      method: 'get',
      url: `${url}${sitesEndpoint}/${siteId}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      validateStatus: null,
    });
    assert.ok(
      getSiteByIdDeletedSite.status === 404,
      `GET /sites/{siteId} status code for missing site not correct ${getSiteByIdDeletedSite.status}`,
    );
    console.log('PASSED');
  } catch (uncaughtError) {
    console.error(uncaughtError);
    throw uncaughtError;
  }
}

// handler()

module.exports = {
  handler,
};
