import {
  constants,
  addTextToElement,
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

  const lastWeeksDate = new Date();
  lastWeeksDate.setDate(lastWeeksDate.getDate() - 7);
  const currentDate = new Date();
  const [lastWeeksDateString] = lastWeeksDate.toISOString().split('T');
  const [currentDateString] = currentDate.toISOString().split('T');
  const statsParams = {
    startDate: lastWeeksDateString,
    endDate: currentDateString,
  };

  fetch(`${ANALYTICS_SERVICE_URL}/v1/sites/${siteId}/stats?` + new URLSearchParams(statsParams), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not OK');
      }

      return response.json();
    })
    .then((jsonData) => {
      if (DEBUG) {
        console.log(jsonData);
      }

      const lineChartData = Object.entries(jsonData).map(([k, v]) => {
        return {
          x: k,
          y: v.pageView.overall,
        };
      }).sort((a, b) => {
        // x property is the date
        return new Date(a.x) - new Date(b.x);
      });
      if (DEBUG) {
        console.log(lineChartData);
      }

      const weeklyViewsChart = new Chart(
        document.getElementById('weekly-views-chart'),
        {
          type: 'line',
          data: {
            datasets: [{
              label: 'Views',
              data: lineChartData,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.4,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Past Week\'s Views',
              },
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Date',
                },
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: 'Views',
                },
              },
            },
          },
        },
      );

      const weeklyPageViewData = {};
      Object.keys(jsonData).forEach((date) => {
        const datePageView = jsonData[date].pageView;
        const {
          overall,
          ...actualPageViews
        } = datePageView;
        Object.keys(actualPageViews).forEach((page) =>{
          const existingPageCount = weeklyPageViewData[page] || 0;
          const todaysPageCount = actualPageViews[page];
          const newPageCount = existingPageCount + todaysPageCount;
          weeklyPageViewData[page] = newPageCount;
        });
      });
      if (DEBUG) {
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
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Page',
                },
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: 'Views',
                },
              },
            },
          },
        },
      );
    })
    .catch((err) => {
      if (DEBUG) {
        console.error(err);
      }
    });
}

// Run this as the script is called
window.addEventListener('load', onPageLoad);
