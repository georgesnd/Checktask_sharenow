# Checktask_sharenow

Prerequisite: existing docker hub account and remote docker repository

When starting your cluster with kind create, specify the cluster.yml as a config: `kind create cluster --config=./cluster.yml`

Inside the ./config/pod.yml file the image should be named like your image on dockerhub `accountname/imagename`
for me it is georgesnd/test because i have used `docker build . -t georgesnd/test` and `docker push georgesnd/test` to setup the image.

Then run `kubectl apply -f ./config` (first time might fail because the service account in pod.yml isn't there yet, so i run it twice in my case).

What should happen afterwards is that you have a "checker" pod running in the cluster. you can check this by running `kubectl get pods`.

And if you navigate to localhost:31000 in your browser, you should see the output of the evaluation.
to see all the pod logs open http://localhost:31000/pods

If any changes are made to index.js file, following commands should be run
```
docker build . -t accountname/imagename
docker push accountname/imagename
kubectl delete pod checker
kubectl apply -f ./config
```
