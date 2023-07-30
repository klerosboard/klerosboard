import { ApolloClient, gql, InMemoryCache, NormalizedCacheObject } from "@apollo/client";

const mainnetClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/klerosboard/klerosboard-mainnet",
  cache: new InMemoryCache(),
});

const gnosisClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/klerosboard/klerosboard-gnosis",
  cache: new InMemoryCache(),
});

const suscriptionsClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/klerosboard/klerosboard-subscriptions",
  cache: new InMemoryCache(),
});

const curateGnosisClient =  new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/kleros/legacy-curate-xdai",
  cache: new InMemoryCache(),
});


const apolloClientQuery = async<T>(chainId: string, queryString: string, variables: Record<string, any> = {}) => {
  if (chainId === '100') return apolloQuery<T>(gnosisClient, queryString, variables);
  return apolloQuery<T>(mainnetClient, queryString, variables);
};

const apolloSuscriptionQuery = async<T>(queryString: string, variables: Record<string, any> = {}) => {
  return apolloQuery<T>(suscriptionsClient, queryString, variables);
};

const apolliCurateGnosisQuery = async<T>(queryString: string, variables: Record<string, any> = {}) => {
  return apolloQuery<T>(curateGnosisClient, queryString, variables);
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

export {apolloClientQuery, apolloSuscriptionQuery, apolliCurateGnosisQuery};