import random
import time

class Individual:
    def __init__(self, chromosome):
        self.chromosome = chromosome
        self.fitness = 0
        self.distance = 0
        self.load = 0

def generate_individual(numBins, numVehicles):
    sampleArray = list(range(1, numBins + 1))
    if (num_vehicles != 1):
        sampleArray += ['p'] * (numVehicles - 1)
    chromosome = random.sample(sampleArray, numBins + (numVehicles - 1))

    return Individual(chromosome)

def evaluate_fitness(individual, distanceMatrix, demandArray, vehicleCapacity, penalty_val):
    chromosome = individual.chromosome

    routes = []
    currentRoute = []
    for item in chromosome:
        #print(item)
        if item == 'p':
            routes.append(currentRoute)
            currentRoute = []
        else:
            currentRoute.append(item)
    routes.append(currentRoute)

    totalDistance = 0

    #print(routes)

    #distance
    for route in routes:
        if(len(route) == 0):
            continue

        routeDistance = 0

        routeDistance += distanceMatrix[0][route[0]]

        if(len(route) > 1):
            for i in range(len(route) - 1):
                #print(f"{route[i]}-{route[i + 1]} routedne ;) {distanceMatrix[route[i]][route[i + 1]]}")
                #print(route, type(route))
                routeDistance += distanceMatrix[route[i]][route[i + 1]]

        routeDistance += distanceMatrix[route[len(route) - 1]][0]

        #print(f"rotada: {distanceMatrix[0][route[0]]}, {distanceMatrix[route[len(route) - 1]][0]}")

        #print(route, routeDistance)

        totalDistance += routeDistance
    
    #capacity
    penalty = 0
    totalLoad = 0

    for route in routes:
        if(len(route) == 0):
            continue

        routeLoad = 0

        for i in range(len(route)):
            routeLoad += demandArray[route[i]]

        totalLoad += routeLoad
        
        if(routeLoad > vehicleCapacity):
            excessCapacity = routeLoad - vehicleCapacity
            penalty += excessCapacity * penalty_val

    individual.distance = totalDistance
    individual.load = totalLoad
    individual.fitness = totalDistance + penalty

def crossover(parent1, parent2):
    crossover_point = random.randint(0, len(parent1.chromosome) - 1)
    childChromosome = parent1.chromosome[:crossover_point] + parent2.chromosome[crossover_point:]

    for gene in childChromosome:
        repeat = childChromosome.count(gene)
        if repeat > 1:
            for gene2 in parent1.chromosome[crossover_point:]:
                if gene2 not in childChromosome:
                    index = childChromosome.index(gene)
                    childChromosome[index] = gene2
                    break

    #print(f"p1: {parent1.chromosome} p2: {parent2.chromosome} crossover: {childChromosome} index: {crossover_point}, {parent1.chromosome[:crossover_point]} {parent2.chromosome[crossover_point:]}")

    return Individual(childChromosome)

def partially_mapped_crossover(parent1, parent2):
    size = len(parent1.chromosome)
    start, end = sorted(random.sample(range(size), 2))
    mapping = {parent2.chromosome[i]: parent1.chromosome[i] for i in range(start, end + 1)}
    
    child = [None] * size
    child[start:end + 1] = parent2.chromosome[start:end + 1]
    
    for i in range(size):
        if child[i] is None:
            gene = parent1.chromosome[i]
            while gene in mapping:
                gene = mapping[gene]
            child[i] = gene
    
    return Individual(child)

def order_crossover(parent1, parent2):
    size = len(parent1.chromosome)
    start, end = sorted(random.sample(range(size), 2))
    
    child = [None] * size
    child[start:end + 1] = parent1.chromosome[start:end + 1]
    
    remaining_genes = [gene for gene in parent2.chromosome if gene not in child]
    j = 0
    for i in range(size):
        if child[i] is None:
            child[i] = remaining_genes[j]
            j += 1
    
    return Individual(child)

def aox_crossover(parent1, parent2):
    size = len(parent1.chromosome)
    offspring = [-1] * size

    start, end = sorted(random.sample(range(size), 2))
    subset = parent1.chromosome[start:end + 1]

    offspring[start:end + 1] = subset

    j = parent2.chromosome.index(subset[-1])
    for i in range(size):
        if offspring[i] == -1:
            while (parent2.chromosome[j] in subset):
                j += 1

                if j == len(parent2.chromosome):
                    j = 0

            offspring[i] = parent2.chromosome[j]
            j += 1

            if j == len(parent2.chromosome):
                j = 0

    return Individual(offspring)

## p1: [1, 3, 2, 'p'] p2: ['p', 1, 3, 2] crossover: [1, 3, 3, 2] index: 3, [1, 3, 2] [2]
## [1, 3, 2, 2]

## p1: [1, 3, 2, 'p'] p2: ['p', 2, 3, 1] crossover: [2, 3, 3, 'p'] index: 2, [1, 3] [3, 1]
## 2 'p' 3 1

## p 1 2 3
## 3 2 1 p

def mutate(individual):
    binIndices = random.sample(range(len(individual.chromosome)), 2)
    individual.chromosome[binIndices[0]], individual.chromosome[binIndices[1]] = \
        individual.chromosome[binIndices[1]], individual.chromosome[binIndices[0]]
    
    return individual
        
def inversion_mutation(individual):
    size = len(individual.chromosome)

    start, end = sorted(random.sample(range(size), 2))

    mutated_chromosome = individual.chromosome[:start] + list(reversed(individual.chromosome[start:end + 1])) + individual.chromosome[end + 1:]

    return Individual(mutated_chromosome)

def select_parents(population):
    tournament_size = 5
    selected_parents = []

    for _ in range(len(population)):
        tournament_indices = random.sample(range(len(population)), tournament_size)
        tournament_fitness = [population[i].fitness for i in tournament_indices]
        selected_parents.append(population[tournament_indices[tournament_fitness.index(max(tournament_fitness))]])

    return selected_parents

def genetic_algorithm(numGenerations, populationSize, numBins, numVehicles, distanceMatrix, demandArray, vehicleCapacity, penalty_val):
    population = [generate_individual(numBins, numVehicles) for _ in range(populationSize)]

    for generation in range(numGenerations):
        #for i in population:
        #    print(i.chromosome)
        for individual in population:
            evaluate_fitness(individual, distanceMatrix, demandArray, vehicleCapacity, penalty_val)

        population.sort(key=lambda x: x.fitness)

        elite_size = int(0.2 * population_size)
        nextGeneration = population[:elite_size]

        while len(nextGeneration) < population_size:
            parent1 = random.choice(population[:elite_size])
            parent2 = random.choice(population[:elite_size])

            child = aox_crossover(parent1, parent2)
            #child = partially_mapped_crossover(parent1, parent2)

            if random.random() < 0.05:
                child = inversion_mutation(child)
                #child = mutate(child)
            nextGeneration.append(child)

        population = nextGeneration

        #if(generation % 100 == 0):
        #    print(f"Generation {generation + 1}: Best Fitness = {population[0].fitness}, {population[0].chromosome}")

        #for i in range(5):
        #    print(population[i].chromosome)

    return population[0]

"""distance_matrix = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0]
]"""

"""distanceMatrix = [
  [0, 72, 53, 20, 65, 66, 49, 58, 89, 16, 14, 90, 71],
  [48, 0, 62, 93, 74, 95, 10, 35, 83, 62, 95, 99, 97],
  [97, 82, 0, 42, 59, 14, 34, 52, 49, 38, 28, 51, 78],
  [67, 16, 51, 0, 28, 14, 76, 38, 17, 78, 17, 30, 60],
  [13, 59, 63, 50, 0, 87, 80, 86, 40, 57, 54, 37, 99],
  [17, 68, 84, 19, 94, 0, 61, 47, 10, 30, 95, 26, 48],
  [46, 34, 53, 90, 43, 65, 0, 69, 53, 43, 90, 70, 10],
  [75, 57, 53, 51, 62, 85, 42, 0, 52, 78, 26, 63, 31],
  [82, 27, 91, 67, 70, 18, 97, 32, 0, 85, 43, 59, 60],
  [22, 74, 35, 89, 58, 11, 71, 72, 81, 0, 80, 59, 39],
  [26, 99, 58, 25, 31, 67, 78, 79, 58, 82, 0, 42, 14],
  [35, 74, 61, 10, 68, 93, 37, 19, 13, 68, 27, 0, 74],
  [89, 30, 29, 67, 79, 31, 87, 83, 46, 47, 29, 70, 0],
]"""
import sys

rows = sys.argv[1].split(";")

distanceMatrix = [list(map(float, row.split(','))) for row in rows]

distanceMatrix = [[round(j) for j in i] for i in distanceMatrix]

demandArray = [float(i) for i in sys.argv[2].split(',')]

demandArray = [round(i) for i in demandArray]

num_vehicles = int(sys.argv[3])

vehicleCapacity = int(sys.argv[4])

penalty_val = int(round(float(sys.argv[5])))

num_generations = 1000
population_size = 100
num_bins = len(distanceMatrix) - 1

best_solution = genetic_algorithm(num_generations, population_size, num_bins, num_vehicles, distanceMatrix, demandArray, vehicleCapacity, penalty_val)
#print("Best Solution:", best_solution.chromosome)
#print("Best Distance:", best_solution.distance)
#print("Best Load:", best_solution.load)
#print("Best Fitness:", best_solution.fitness)

"""
total = 0
total_time = 0

for i in range(100):
    start_time = time.time()

    sol = genetic_algorithm(num_generations, population_size, num_bins, num_vehicles, distanceMatrix, demandArray, vehicleCapacity, penalty_val)

    end_time = time.time()

    total += sol.distance

    elapsed_time = end_time - start_time
    
    total_time += elapsed_time
    #print(f"Elapsed Time: {elapsed_time} seconds", sol.distance)

print(f"average distance: {total / 100} --- average elapsed time: {total_time / 100}")
"""

vehicleNo = 0
route = [0]
totalDistance = 0
totalLoad = 0

#print(best_solution.chromosome)

print("0|", end="")
for gene in best_solution.chromosome:
    if gene != 'p':
        route.append(gene)

    if gene == 'p' or gene == best_solution.chromosome[len(best_solution.chromosome) - 1]:
        route.append(0)
        for index in range(len(route)):
            if index != len(route) - 1:
                print(f"{route[index]},", end="")
            else:
                print(f"{route[index]}", end="")

        routeDistance = 0
        routeLoad = 0

        if(len(route) > 1):
            for i in range(len(route) - 1):
                #print(f"{route[i]}-{route[i + 1]} routedne ;) {distanceMatrix[route[i]][route[i + 1]]}")
                routeDistance += distanceMatrix[route[i]][route[i + 1]]

            for i in range(len(route)):
                routeLoad += demandArray[route[i]]

        vehicleNo += 1

        print(f"|{routeDistance}|{routeLoad}")

        if gene != best_solution.chromosome[len(best_solution.chromosome) - 1]:
            print(f"{vehicleNo}|", end="")
        
        route = [0]

        totalDistance += routeDistance
        totalLoad += routeLoad
        
print(f"{totalDistance}|{totalLoad}")
