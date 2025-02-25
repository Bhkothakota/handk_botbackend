const axios = require('axios');

const {ActionTypes,MessageFactory} = require ('botbuilder');
 
async function fetchContentsAndUrls(query,userId) {
  try {
      const url = process.env.url;
      const headers = {
          'accept': 'application/json',
          'Content-Type': 'application/json',
      };
      const data = {
          search_text: query,
          userId: userId,
      }; 
      const response = await axios.post(url, data, { headers });
      const result = response.data;
      const contents = [];
      const urls = [];
      const followupQueries = [];
 
      if (Array.isArray(result.response) && result.response.length > 0) {
          const item = result.response[0];
          
          if (item.content && typeof item.content === 'string') {
              contents.push(item.content);
          } 
          if (Array.isArray(item.source)) {
              item.source.forEach((sourceItem) => {
                  if (typeof sourceItem === 'object' && sourceItem !== null) {
                      let title = sourceItem.title || 'Untitled';
                      
                      if (sourceItem.url) {
                          urls.push({ title: title, url: sourceItem.url });
                      }
                  } else if (typeof sourceItem === 'string' && sourceItem.startsWith('http')) {
                      urls.push({ title: 'Untitled', url: sourceItem });
                  }
              });
          }
      }  
      if (Array.isArray(result.followup)) {
          result.followup.forEach((followupItem) => {
              if (followupItem.query && 
                  typeof followupItem.query === 'string' &&
                  followupItem.button && 
                  typeof followupItem.button === 'string') {
                  followupQueries.push({
                      query: followupItem.query,
                      button: followupItem.button
                  });
              }
          });
      } 
      return { contents, urls, followupQueries };
  } catch (error) {
      console.error('Error fetching contents and URLs:', error.message);
      return { contents: [], urls: [], followupQueries: [] };
  }
} 
module.exports = {fetchContentsAndUrls};
