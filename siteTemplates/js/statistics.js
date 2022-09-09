import {
  addTextToElement,
  constants,
  getCookie,
} from "./util.js";

const ANALYTICS_SERVICE_URL = '{{{ ANALYTICS_SERVICE_URL }}}';
const DEBUG = 'true' === 'true';

function onPageLoad() {
  const token = getCookie(constants.tokenCookieName);
  if (!token) {
    window.location.replace('/signin.html');
  }

  const params = new URLSearchParams(document.location.search);
  const siteId = params.get("siteId");
  if (!siteId) {
    const text = document.createTextNode('Invalid Site ID');
    const statsTextElement = document.getElementById('stats-text');
    statsTextElement.appendChild(text);
    return;
  }

  const daysInMonth = 30;
  const lastMonthsDate = new Date();
  lastMonthsDate.setDate(lastMonthsDate.getDate() - daysInMonth);
  const lastWeeksDate = new Date();
  lastWeeksDate.setDate(lastWeeksDate.getDate() - 6);
  const currentDate = new Date();
  const [lastMonthsDateString] = lastMonthsDate.toISOString().split('T');
  const [lastWeeksDateString] = lastWeeksDate.toISOString().split('T');
  const [currentDateString] = currentDate.toISOString().split('T');

  /*******************
  The first request is for a month's worth of totalPageViews data.
  Includes 2 textual stats and 1 chart.
  *******************/

  const monthStatsParams = {
    startDate: lastMonthsDateString,
    endDate: currentDateString,
    categories: 'totalPageViews',
  };

  fetch(`${ANALYTICS_SERVICE_URL}/v1/sites/${siteId}/stats?` + new URLSearchParams(monthStatsParams), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
    .then((response) => {
      // Check for 401
      if (response.status === 401) {
        if (DEBUG) {
          console.log('Recieved 401, redirecting to sign in.');
        }

        window.location.replace('/signin.html');
      }

      // Other uncovered error codes
      if (!response.ok) {
        throw new Error('Network response was not OK');
      }

      return response.json();
    })
    .then((jsonData) => {
      if (DEBUG) {
        console.log('Month\'s data');
        console.log(jsonData);
      }

      // Textual stats
      const datesOfLastWeek = [];
      const countingDate = new Date();
      for (let i = 1; i <= 7; i++) {
        const [countingDateString] = countingDate.toISOString().split('T');
        datesOfLastWeek.push(countingDateString);
        countingDate.setDate(countingDate.getDate() - 1);
      }
      if (DEBUG) {
        console.log('datesOfLastWeek');
        console.log(datesOfLastWeek);
      }

      const weekOfData = {};
      let weekViewCount = 0;
      let monthViewCount = 0;
      Object.entries(jsonData).forEach(([date, value]) => {
        if (!value.totalPageViews) {
          return;
        }

        if (datesOfLastWeek.includes(date)) {
          weekViewCount += value.totalPageViews;
          // Copy data over to smaller structure to build chart with
          weekOfData[date] = value;
        }

        monthViewCount += value.totalPageViews;
      });

      const weekCountText = `${weekViewCount} views over the past 7 days`;
      addTextToElement('sliding-week-count', weekCountText);

      const monthCountText = `${monthViewCount} views over the past ${daysInMonth} days`;
      addTextToElement('sliding-month-count', monthCountText);

      // Chart
      const totalPageViews = Object.entries(weekOfData).map(([k, v]) => {
        return {
          x: k,
          y: v.totalPageViews || 0,
        };
      }).sort((a, b) => {
        // x property is the date
        return new Date(a.x) - new Date(b.x);
      });
      if (DEBUG) {
        console.log('totalPageViews');
        console.log(totalPageViews);
      }

      const totalPageViewsChart = new Chart(
        document.getElementById('total-page-views-chart'),
        {
          type: 'line',
          data: {
            datasets: [{
              label: 'Views',
              data: totalPageViews,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.4,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Total Page Views',
              },
              legend: {
                display: false,
              },
            },
          },
        },
      );
    })
    .catch((exc) => {
      if (DEBUG) {
        console.error('Error getting text-based stats.');
        console.error(exc);
      }
    });

  /*******************
  The second request is for a week's worth of pageViews data.
  Includes creating 1 chart.
  *******************/

  const pageViewStatsParams = {
    startDate: lastWeeksDateString,
    endDate: currentDateString,
    //categories: 'pageView',
  };

  fetch(`${ANALYTICS_SERVICE_URL}/v1/sites/${siteId}/stats?` + new URLSearchParams(pageViewStatsParams), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
    .then((response) => {
      // Check for 401
      if (response.status === 401) {
        if (DEBUG) {
          console.log('Recieved 401, redirecting to sign in.');
        }

        window.location.replace('/signin.html');
      }

      // Other uncovered error codes
      if (!response.ok) {
        throw new Error('Network response was not OK');
      }

      return response.json();
    })
    .then((jsonData) => {
      if (DEBUG) {
        console.log('Week\'s data');
        console.log(jsonData);
      }


      const weeklyPageViewData = {};
      Object.keys(jsonData).forEach((date) => {
        const datePageView = jsonData[date].pageView;
        Object.keys(datePageView).forEach((page) =>{
          const existingPageCount = weeklyPageViewData[page] || 0;
          const todaysPageCount = datePageView[page];
          const newPageCount = existingPageCount + todaysPageCount;
          weeklyPageViewData[page] = newPageCount;
        });
      });
      if (DEBUG) {
        console.log('weeklyPageViewData');
        console.log(weeklyPageViewData);
      }

      const topTenPageViews = Object.entries(weeklyPageViewData).sort((a, b) => {
        return b[1] - a[1];
      }).slice(0, 10).map((entry) => {
        return {
          x: entry[0],
          y: entry[1],
        };
      });
      if (DEBUG) {
        console.log('topTenPageViews');
        console.log(topTenPageViews);
      }

      const topTenPageViewsChart = new Chart(
        document.getElementById('top-ten-page-views-chart'),
        {
          type: 'bar',
          data: {
            datasets: [{
              label: 'Page Views',
              data: topTenPageViews,
              backgroundColor: 'rgb(75, 192, 192)',
            }],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Past Week\'s Page Views',
              },
              legend: {
                display: false,
              },
            },
            scales: {
              x: {
                // Shorten the page name length
                ticks: {
                  callback: function(value, index, ticks) {
                    const maxTickLength = 10
                    const page = this.getLabelForValue(value)
                    if (page.length > maxTickLength) {
                      return `${page.slice(0, maxTickLength - 3)}...`;
                    } else {
                      return page;
                    }
                  },
                },
              },
            },
          },
        },
      );
    })
    .catch((err) => {
      if (DEBUG) {
        console.error('Error creating charts.');
        console.error(err);
      }
    });
}

// Run this as the script is called
window.addEventListener('load', onPageLoad);
