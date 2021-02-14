const got = require('@/utils/got');
const formatPubDate = require('@/utils/date');
const cheerio = require('cheerio');
const FormData = require('form-data');

const titles = {
    '': '最新报道',
    1: '晚点独家',
    2: '人物访谈',
    3: '晚点早知道',
    4: '长报道',
};

const rootUrl = 'https://www.latepost.com';

const dateAdapter = (date) => {
    if (!date) {
        return '刚刚';
    }
    const incompleteDate = ['今天', '昨天', '前天'];
    if (incompleteDate.indexOf(date) !== -1) {
        return `${date} 00:00`;
    } else {
        return date;
    }
};

module.exports = async (ctx) => {
    const proma = ctx.params.proma || '';
    const formData = new FormData();
    formData.append('page', 1);
    let data;
    if (proma === '') {
        const apiUrl = `${rootUrl}/site/index`;
        formData.append('limit', 14);
        const [first, response] = await Promise.all([
            got({ method: 'get', url: rootUrl }),
            got({
                method: 'post',
                url: apiUrl,
                body: formData,
            }),
        ]);
        const $ = cheerio.load(first.data);
        const firstItem = {};
        firstItem.title = $('.headlines-title a').text();
        firstItem.detail_url = `${$('.headlines-title a').attr('href')}`;
        data = [firstItem].concat(response.data.data || []);
    } else {
        const apiUrl = `${rootUrl}/news/get-news-data`;
        formData.append('limit', 15);
        const response = await got({
            method: 'post',
            url: apiUrl,
            body: formData,
        });
        data = response.data.data;
    }

    const items = data.map((item) => ({
        title: item.title,
        description: item.abstract || item.intro || item.title,
        link: `${rootUrl}${item.detail_url}`,
        pubDate: formatPubDate(dateAdapter(item.release_time), 0),
    }));

    ctx.state.data = {
        title: `晚点LatePost-${titles[proma]}`,
        link: rootUrl,
        item: items,
    };
};
