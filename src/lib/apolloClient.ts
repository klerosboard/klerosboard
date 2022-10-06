import { ApolloClient, gql, InMemoryCache, NormalizedCacheObject } from "@apollo/client";

const mainnetClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/salgozino/klerosboard",
  cache: new InMemoryCache(),
});

const gnosisClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/salgozino/klerosboard-xdai",
  cache: new InMemoryCache(),
});


const apolloClientQuery = async<T>(chainId: string, queryString: string, variables: Record<string, any> = {}) => {
  if (chainId === '100') return apolloQuery<T>(gnosisClient, queryString, variables);
  return apolloQuery<T>(mainnetClient, queryString, variables);
};


const apolloQuery = async<T>(client: ApolloClient<NormalizedCacheObject >, queryString: string, variables: Record<string, any> = {}) => {
  try {
    return client.query<T>({
      query: gql(queryString),
      variables: variables
    });
  } catch (err) {
    console.error("graph ql error: ", err);
  }
};

export {apolloClientQuery};