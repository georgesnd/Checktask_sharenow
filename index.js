const express = require("express");
const k8s = require("@kubernetes/client-node");
const test = k8s.V1Pod;

const app = express();
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

app.get("/", async (req, res) => {
  try {
    const pods = await k8sApi.listPodForAllNamespaces();
    console.log("this is pod", pods);
    const validations = pods.body.items.reduce(
      (validations, pod) => [
        ...validations,
        { pod: pod.metadata.name, rule_evaluation: evaluateRules(pod) },
      ],
      []
    );
    validations.forEach((validation) => console.log(validation));
    res.json(validations);
  } catch (err) {
    res.json(err);
    console.error("Error: ", err);
  }
});

app.get("/pods", async (req, res) => {
  try {
    const pods = await k8sApi.listPodForAllNamespaces();
    console.log("this is pod", pods);

    res.json(pods.body.items);
  } catch (err) {
    res.json(err);
    console.error("Error: ", err);
  }
});

const server = app.listen(4000);

/**
 * @param {k8s.V1Pod} pod
 * @returns {{name: string, valid:boolean}[]}
 */
function evaluateRules(pod) {
  return [
    {
      name: "image_prefix",
      valid: podContainersHaveImagePrefix("bitnami", pod),
    },
    {
      name: "team_label_present",
      valid: hasLabel("team", pod),
    },
    {
      name: "recent_start_time",
      valid: isNotRunningForLongerThanSevenDays(pod),
    },
  ];
}

/**
 * @param {string} prefix
 * @param {k8s.V1Pod} pod
 * @returns {boolean}
 */
function podContainersHaveImagePrefix(prefix, pod) {
  for (const container of pod.spec.containers) {
    if (container.image.split("/")[0] !== prefix) return false;
  }
  return true;
}

/**
 * @param {string} label
 * @param {k8s.V1Pod} pod
 * @returns {boolean}
 */
function hasLabel(label, pod) {
  const team_label = pod.metadata.labels.hasOwnProperty(label);
  if (team_label == true && pod.metadata.labels[label] !== "") {
    return true;
  } else {
    return false;
  }
}

/**
 *
 * @param {k8s.V1Pod} pod
 * @returns {boolean}
 */
function isNotRunningForLongerThanSevenDays(pod) {
  const startTime = pod.status.startTime;
  const creationTimestamp = startTime;
  const now = new Date();
  const datefromAPITimeStamp = new Date(creationTimestamp).getTime();
  const nowTimeStamp = now.getTime();
  const microSecondsDiff = Math.abs(datefromAPITimeStamp - nowTimeStamp);
  const daysDiff = Math.round(microSecondsDiff / (1000 * 60 * 60 * 24));
  var recent = daysDiff <= 7;
  return recent;
}

process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed");
  });
});
